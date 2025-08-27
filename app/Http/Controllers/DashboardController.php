<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Finance;
use App\Models\Meeting;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard cards data with total counts.
     */
    public function cards(): JsonResponse
    {
        $data = [
            'total_meetings' => Meeting::count(),
            'total_users' => User::count(),
            'total_members' => Member::count(),
            'total_events' => Event::count(),
            'total_finances' => Finance::count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get dashboard charts data with monthly breakdowns.
     */
    public function charts(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 5),
        ]);

        $year = $request->input('year', date('Y'));
        $month = $request->input('month');

        $data = [
            'events' => $this->getEventChartData($year, $month),
            'finances' => $this->getFinanceChartData($year, $month),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'filters' => [
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    /**
     * Get monthly event counts for charts.
     */
    private function getEventChartData(int $year, ?int $month): array
    {
        $query = Event::select(
            DB::raw('MONTH(event_date) as month'),
            DB::raw('COUNT(*) as count'),
            'category'
        )
        ->whereYear('event_date', $year);

        if ($month) {
            $query->whereMonth('event_date', $month);
            
            // For specific month, group by day
            $query = Event::select(
                DB::raw('DAY(event_date) as day'),
                DB::raw('COUNT(*) as count'),
                'category'
            )
            ->whereYear('event_date', $year)
            ->whereMonth('event_date', $month)
            ->groupBy(DB::raw('DAY(event_date)'), 'category')
            ->orderBy(DB::raw('DAY(event_date)'));
        } else {
            $query->groupBy(DB::raw('MONTH(event_date)'), 'category')
                  ->orderBy(DB::raw('MONTH(event_date)'));
        }

        $results = $query->get();

        // Format data for charts
        if ($month) {
            return $this->formatDailyEventData($results, $year, $month);
        } else {
            return $this->formatMonthlyEventData($results);
        }
    }

    /**
     * Get monthly finance sums for charts.
     */
    private function getFinanceChartData(int $year, ?int $month): array
    {
        $query = Finance::select(
            DB::raw('MONTH(transaction_date) as month'),
            DB::raw('SUM(CASE WHEN type = "income" THEN balance ELSE 0 END) as total_income'),
            DB::raw('SUM(CASE WHEN type = "expense" THEN balance ELSE 0 END) as total_expense'),
            DB::raw('SUM(CASE WHEN type = "income" THEN balance ELSE -balance END) as net_amount')
        )
        ->whereYear('transaction_date', $year);

        if ($month) {
            $query->whereMonth('transaction_date', $month);
            
            // For specific month, group by day
            $query = Finance::select(
                DB::raw('DAY(transaction_date) as day'),
                DB::raw('SUM(CASE WHEN type = "income" THEN balance ELSE 0 END) as total_income'),
                DB::raw('SUM(CASE WHEN type = "expense" THEN balance ELSE 0 END) as total_expense'),
                DB::raw('SUM(CASE WHEN type = "income" THEN balance ELSE -balance END) as net_amount')
            )
            ->whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->groupBy(DB::raw('DAY(transaction_date)'))
            ->orderBy(DB::raw('DAY(transaction_date)'));
        } else {
            $query->groupBy(DB::raw('MONTH(transaction_date)'))
                  ->orderBy(DB::raw('MONTH(transaction_date)'));
        }

        $results = $query->get();

        // Format data for charts
        if ($month) {
            return $this->formatDailyFinanceData($results, $year, $month);
        } else {
            return $this->formatMonthlyFinanceData($results);
        }
    }

    /**
     * Format monthly event data for charts.
     */
    private function formatMonthlyEventData($results): array
    {
        $months = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $data = [];
        $categories = ['Cabang', 'AMK', 'Wanita'];

        // Initialize all months with zero counts
        foreach ($months as $monthNum => $monthName) {
            $monthData = [
                'month' => $monthNum,
                'month_name' => $monthName,
                'total_events' => 0,
            ];
            
            foreach ($categories as $category) {
                $monthData[strtolower($category) . '_events'] = 0;
            }
            
            $data[$monthNum] = $monthData;
        }

        // Fill in actual data
        foreach ($results as $result) {
            $monthNum = $result->month;
            $category = strtolower($result->category);
            
            $data[$monthNum]['total_events'] += $result->count;
            $data[$monthNum][$category . '_events'] = $result->count;
        }

        return array_values($data);
    }

    /**
     * Format daily event data for charts.
     */
    private function formatDailyEventData($results, int $year, int $month): array
    {
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $data = [];
        $categories = ['Cabang', 'AMK', 'Wanita'];

        // Initialize all days with zero counts
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dayData = [
                'day' => $day,
                'date' => sprintf('%04d-%02d-%02d', $year, $month, $day),
                'total_events' => 0,
            ];
            
            foreach ($categories as $category) {
                $dayData[strtolower($category) . '_events'] = 0;
            }
            
            $data[$day] = $dayData;
        }

        // Fill in actual data
        foreach ($results as $result) {
            $day = $result->day;
            $category = strtolower($result->category);
            
            $data[$day]['total_events'] += $result->count;
            $data[$day][$category . '_events'] = $result->count;
        }

        return array_values($data);
    }

    /**
     * Format monthly finance data for charts.
     */
    private function formatMonthlyFinanceData($results): array
    {
        $months = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $data = [];

        // Initialize all months with zero amounts
        foreach ($months as $monthNum => $monthName) {
            $data[$monthNum] = [
                'month' => $monthNum,
                'month_name' => $monthName,
                'total_income' => 0,
                'total_expense' => 0,
                'net_amount' => 0,
            ];
        }

        // Fill in actual data
        foreach ($results as $result) {
            $monthNum = $result->month;
            
            $data[$monthNum]['total_income'] = (float) $result->total_income;
            $data[$monthNum]['total_expense'] = (float) $result->total_expense;
            $data[$monthNum]['net_amount'] = (float) $result->net_amount;
        }

        return array_values($data);
    }

    /**
     * Format daily finance data for charts.
     */
    private function formatDailyFinanceData($results, int $year, int $month): array
    {
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        $data = [];

        // Initialize all days with zero amounts
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $data[$day] = [
                'day' => $day,
                'date' => sprintf('%04d-%02d-%02d', $year, $month, $day),
                'total_income' => 0,
                'total_expense' => 0,
                'net_amount' => 0,
            ];
        }

        // Fill in actual data
        foreach ($results as $result) {
            $day = $result->day;
            
            $data[$day]['total_income'] = (float) $result->total_income;
            $data[$day]['total_expense'] = (float) $result->total_expense;
            $data[$day]['net_amount'] = (float) $result->net_amount;
        }

        return array_values($data);
    }
}