import React, { useState, useRef } from 'react';
import {
  Users,
  UserMinus,
  TrendingUp,
  Brain,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Upload,
  FileText,
  Table
} from 'lucide-react';

const metrics = {
  totalEmployees: 1250,
  attritionRate: '15.2%',
  performanceScore: 8.4,
  retentionRate: '84.8%'
};

const departments = [
  { name: 'Sales', attrition: 18, performance: 7.8 },
  { name: 'Engineering', attrition: 12, performance: 8.6 },
  { name: 'Marketing', attrition: 15, performance: 8.2 },
  { name: 'HR', attrition: 8, performance: 8.9 }
];

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
}

function MetricCard({ icon: Icon, title, value, description }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface Prediction {
  row: number;
  attrition_prediction: boolean;
  performance_prediction: number;
  [key: string]: any; // For dynamic columns from CSV
}

interface ColumnSummary {
  type: string;
  unique_values: number;
  missing_values: number;
  mean?: number;
  min?: number;
  max?: number;
}

interface Analysis {
  total_rows: number;
  total_columns: number;
  columns: string[];
  mapped_features: string[];
  summary: { [key: string]: ColumnSummary };
}

function DepartmentCard({ department }: { department: typeof departments[0] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-md transition-all">
      <h3 className="font-semibold text-lg text-gray-900">{department.name}</h3>
      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Attrition Rate</span>
          <span className="font-medium text-gray-900">{department.attrition}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${department.attrition}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Performance Score</span>
          <span className="font-medium text-gray-900">{department.performance}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(department.performance / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPredictions([]);
    setAnalysis(null);
    
    try {
      const fileInput = fileInputRef.current;
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        throw new Error('Please select a CSV file');
      }

      const file = fileInput.files[0];
      if (!file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file');
      }

      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }

      const data = await response.json();
      setPredictions(data.predictions);
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Employee Analytics Dashboard</h1>

        {/* File Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-600" />
              Upload Employee Data
            </h2>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Upload your CSV file:
              <div className="text-xs text-gray-500 mt-1">
                The system will analyze all columns and use numeric data for predictions
              </div>
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100
                  cursor-pointer"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-70 whitespace-nowrap"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* File Analysis */}
          {analysis && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                File Analysis
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Total Rows:</span>{' '}
                    <span className="font-medium">{analysis.total_rows}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Total Columns:</span>{' '}
                    <span className="font-medium">{analysis.total_columns}</span>
                  </div>
                </div>

                {/* Features Used Section */}
                <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
                  <h4 className="text-sm font-medium text-indigo-900 mb-2">Features Used for Prediction</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.mapped_features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Values</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Values</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used in Model</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysis.columns.map((col) => {
                        const summary = analysis.summary[col];
                        const isUsed = analysis.mapped_features.some(
                          feature => feature.toLowerCase() === col.toLowerCase()
                        );
                        return (
                          <tr key={col}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.unique_values}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{summary.missing_values}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {summary.mean !== undefined ? (
                                <>
                                  Mean: {summary.mean.toFixed(2)}<br />
                                  Min: {summary.min?.toFixed(2)}<br />
                                  Max: {summary.max?.toFixed(2)}
                                </>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {isUsed ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Predictions Table */}
          {predictions.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-600" />
                Predictions ({predictions.length} rows)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                      {analysis?.columns.map((col) => (
                        <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attrition Risk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {predictions.map((pred) => (
                      <tr key={pred.row}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pred.row}</td>
                        {analysis?.columns.map((col) => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof pred[col] === 'number' ? pred[col].toFixed(2) : pred[col]}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pred.attrition_prediction
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {pred.attrition_prediction ? 'High Risk' : 'Low Risk'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pred.performance_prediction.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={Users}
            title="Total Employees"
            value={metrics.totalEmployees.toLocaleString()}
            description="Current workforce size"
          />
          <MetricCard
            icon={UserMinus}
            title="Attrition Rate"
            value={metrics.attritionRate}
            description="Last 12 months"
          />
          <MetricCard
            icon={TrendingUp}
            title="Performance Score"
            value={metrics.performanceScore}
            description="Average rating out of 10"
          />
          <MetricCard
            icon={Target}
            title="Retention Rate"
            value={metrics.retentionRate}
            description="Current year"
          />
        </div>

        {/* Department Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Department Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept) => (
              <DepartmentCard key={dept.name} department={dept} />
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-yellow-800">
                High attrition risk detected in the Sales department. Consider reviewing compensation packages and career growth opportunities.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-green-800">
                Engineering team shows strong performance metrics. Recommended to implement their best practices across other departments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;