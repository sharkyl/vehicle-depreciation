import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const VehicleDepreciationApp = () => {
    const [depreciationRate, setDepreciationRate] = useState(1.0);
    const [depreciationModel, setDepreciationModel] = useState('monthly');
    const [loanTerm, setLoanTerm] = useState(60);
    const [interestRate, setInterestRate] = useState(6.8);
    const [loanValue, setLoanValue] = useState(65000);
    const [numVehicles, setNumVehicles] = useState(1);

    const calculateData = useMemo(() => {
        // Step 1: Calculate fleet totals
        const totalFleetValue = numVehicles * loanValue;
        const totalLoanAmount = totalFleetValue;

        // Step 2: Calculate monthly payment
        const monthlyRate = interestRate / 100 / 12;
        let totalMonthlyPayment;

        if (monthlyRate === 0) {
            totalMonthlyPayment = totalLoanAmount / loanTerm;
        } else {
            const factor = Math.pow(1 + monthlyRate, loanTerm);
            totalMonthlyPayment = totalLoanAmount * monthlyRate * factor / (factor - 1);
        }

        const paymentPerVehicle = totalMonthlyPayment / numVehicles;

        // Step 3: Generate month-by-month data
        const monthlyData = [];
        let currentFleetValue = totalFleetValue;
        let remainingLoanBalance = totalLoanAmount;

        // Month 0 (initial)
        monthlyData.push({
            month: 0,
            vehicleValue: currentFleetValue,
            loanBalance: remainingLoanBalance,
            equity: 0,
            monthlyPayment: totalMonthlyPayment
        });

        // Calculate each month
        for (let month = 1; month <= loanTerm + 12; month++) {
            // Depreciation
            if (depreciationModel === 'monthly') {
                currentFleetValue = currentFleetValue * (1 - depreciationRate / 100);
            } else if (depreciationModel === 'annual') {
                const years = month / 12;
                currentFleetValue = totalFleetValue * Math.pow(1 - depreciationRate / 100, years);
            } else if (depreciationModel === 'heavyuse') {
                const baseRate = depreciationRate / 100;
                let monthlyDepRate = baseRate;
                if (month <= 6) monthlyDepRate = baseRate * 2;
                else if (month <= 12) monthlyDepRate = baseRate * 1.5;
                else if (month <= 24) monthlyDepRate = baseRate * 1.2;
                currentFleetValue = currentFleetValue * (1 - monthlyDepRate);
            }

            // Loan payment
            if (month <= loanTerm && remainingLoanBalance > 0) {
                const interestPayment = remainingLoanBalance * monthlyRate;
                const principalPayment = totalMonthlyPayment - interestPayment;
                remainingLoanBalance = Math.max(0, remainingLoanBalance - principalPayment);
            }

            const equity = currentFleetValue - remainingLoanBalance;

            monthlyData.push({
                month: month,
                vehicleValue: Math.round(currentFleetValue),
                loanBalance: Math.round(remainingLoanBalance),
                equity: Math.round(equity),
                monthlyPayment: totalMonthlyPayment
            });
        }

        return {
            data: monthlyData,
            monthlyPayment: totalMonthlyPayment,
            paymentPerVehicle: paymentPerVehicle,
            totalLoan: totalLoanAmount,
            fleetValue: totalFleetValue
        };
    }, [depreciationRate, loanTerm, interestRate, loanValue, depreciationModel, numVehicles]);

    const formatCurrency = (value) => {
        if (isNaN(value)) return '$NaN';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatTooltip = (value, name) => {
        if (name === 'Vehicle Value') return [formatCurrency(value), 'Vehicle Value'];
        if (name === 'Loan Balance') return [formatCurrency(value), 'Loan Balance'];
        if (name === 'Equity') return [formatCurrency(value), 'Equity'];
        return [value, name];
    };

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Vehicle Depreciation & Loan Analysis
            </h1>

            {/* Controls */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                {/* Depreciation Model Toggle */}
                <div className="mb-6 text-center">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Depreciation Model
                    </label>
                    <div className="inline-flex rounded-lg border border-gray-300 bg-gray-100 p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setDepreciationModel('monthly');
                                setDepreciationRate(1.0);
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                depreciationModel === 'monthly'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDepreciationModel('annual');
                                setDepreciationRate(15.0);
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                depreciationModel === 'annual'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Annual
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDepreciationModel('heavyuse');
                                setDepreciationRate(1.0);
                            }}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                depreciationModel === 'heavyuse'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Heavy Use
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

                    {/* Number of Vehicles */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Number of Vehicles: {numVehicles}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="200"
                            step="1"
                            value={numVehicles}
                            onChange={(e) => setNumVehicles(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>1</span>
                            <span>200</span>
                        </div>
                    </div>

                    {/* Loan Value */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Loan Value (per vehicle): {formatCurrency(loanValue)}
                        </label>
                        <input
                            type="range"
                            min="45000"
                            max="100000"
                            step="1000"
                            value={loanValue}
                            onChange={(e) => setLoanValue(Number(e.target.value))}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>$45k</span>
                            <span>$100k</span>
                        </div>
                    </div>

                    {/* Depreciation Rate */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Depreciation Rate: {depreciationRate.toFixed(1)}% per {depreciationModel === 'annual' ? 'year' : 'month'}
                        </label>
                        <input
                            type="range"
                            min={depreciationModel === 'annual' ? '5' : '0.5'}
                            max={depreciationModel === 'annual' ? '25' : '2.0'}
                            step={depreciationModel === 'annual' ? '1' : '0.1'}
                            value={depreciationRate}
                            onChange={(e) => setDepreciationRate(Number(e.target.value))}
                            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>{depreciationModel === 'annual' ? '5%' : '0.5%'}</span>
                            <span>{depreciationModel === 'annual' ? '25%' : '2.0%'}</span>
                        </div>
                        {depreciationModel === 'heavyuse' && (
                            <div className="text-xs text-gray-500 mt-1">
                                <div>First 6 months: {(depreciationRate * 2).toFixed(1)}%</div>
                                <div>Months 7-12: {(depreciationRate * 1.5).toFixed(1)}%</div>
                                <div>Months 13-24: {(depreciationRate * 1.2).toFixed(1)}%</div>
                                <div>After 24 months: {depreciationRate.toFixed(1)}%</div>
                            </div>
                        )}
                    </div>

                    {/* Loan Term */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Loan Term: {Math.floor(loanTerm / 12)} years {loanTerm % 12} months
                        </label>
                        <input
                            type="range"
                            min="36"
                            max="60"
                            step="1"
                            value={loanTerm}
                            onChange={(e) => setLoanTerm(Number(e.target.value))}
                            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>3 years</span>
                            <span>5 years</span>
                        </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Interest Rate: {interestRate.toFixed(1)}% annual
                        </label>
                        <input
                            type="range"
                            min="5.0"
                            max="8.0"
                            step="0.1"
                            value={interestRate}
                            onChange={(e) => setInterestRate(Number(e.target.value))}
                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>5.0%</span>
                            <span>8.0%</span>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <div className="text-center">
            <span className="text-lg font-semibold text-gray-800">
              Monthly Payment (Total): {formatCurrency(calculateData.monthlyPayment)}
            </span>
                        {numVehicles > 1 && (
                            <div className="text-sm text-gray-600 mt-1">
                                {formatCurrency(calculateData.paymentPerVehicle)} per vehicle × {numVehicles} vehicles
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug Info */}
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-xs text-gray-700">
                        <div><strong>DEBUG INFO:</strong></div>
                        <div>Fleet Value: {formatCurrency(calculateData.fleetValue)}</div>
                        <div>Total Loan: {formatCurrency(calculateData.totalLoan)}</div>
                        <div>Monthly Rate: {((interestRate / 100 / 12) * 100).toFixed(4)}%</div>
                        <div>Monthly Payment: {formatCurrency(calculateData.monthlyPayment)}</div>
                        <div>Payment Per Vehicle: {formatCurrency(calculateData.paymentPerVehicle)}</div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {numVehicles === 1 ? 'Vehicle Value, Loan Balance & Equity Over Time' : `Fleet Value, Loan Balance & Equity Over Time (${numVehicles} vehicles)`}
                </h2>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={calculateData.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                            <XAxis
                                dataKey="month"
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                formatter={formatTooltip}
                                labelFormatter={(label) => `Month ${label}`}
                                contentStyle={{
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />
                            <Line
                                type="monotone"
                                dataKey="vehicleValue"
                                stroke="#ef4444"
                                strokeWidth={3}
                                name="Vehicle Value"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="loanBalance"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                name="Loan Balance"
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="equity"
                                stroke="#10b981"
                                strokeWidth={3}
                                name="Equity"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Key Insights */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(calculateData.data[12]?.vehicleValue || 0)}
                        </div>
                        <div className="text-sm text-gray-600">{numVehicles === 1 ? 'Vehicle Value After 1 Year' : 'Fleet Value After 1 Year'}</div>
                        {numVehicles > 1 && (
                            <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency((calculateData.data[12]?.vehicleValue || 0) / numVehicles)} per vehicle
                            </div>
                        )}
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(calculateData.data[loanTerm]?.loanBalance || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Loan Balance at End of Term</div>
                        {numVehicles > 1 && (
                            <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency((calculateData.data[loanTerm]?.loanBalance || 0) / numVehicles)} per vehicle
                            </div>
                        )}
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(calculateData.data[loanTerm]?.equity || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Final Equity Position</div>
                        {numVehicles > 1 && (
                            <div className="text-xs text-gray-500 mt-1">
                                {formatCurrency((calculateData.data[loanTerm]?.equity || 0) / numVehicles)} per vehicle
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
        </div>
    );
};

export default VehicleDepreciationApp;