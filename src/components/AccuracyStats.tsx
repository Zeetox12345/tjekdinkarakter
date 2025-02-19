
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AccuracyData {
  total_evaluations: number;
  average_accuracy: number;
  accuracy_distribution: {
    range: string;
    count: number;
  }[];
}

export function AccuracyStats() {
  const [stats, setStats] = useState<AccuracyData | null>(null);

  useEffect(() => {
    fetchAccuracyStats();
  }, []);

  const fetchAccuracyStats = async () => {
    const { data: evaluations, error } = await supabase
      .from("evaluations")
      .select("accuracy_score")
      .not("accuracy_score", "is", null);

    if (error) {
      console.error("Error fetching accuracy stats:", error);
      return;
    }

    const scores = evaluations.map(e => e.accuracy_score as number);
    
    if (scores.length === 0) return;

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Create distribution data
    const distribution = [
      { range: "90-100%", count: 0 },
      { range: "70-89%", count: 0 },
      { range: "50-69%", count: 0 },
      { range: "0-49%", count: 0 },
    ];

    scores.forEach(score => {
      const percentage = score * 100;
      if (percentage >= 90) distribution[0].count++;
      else if (percentage >= 70) distribution[1].count++;
      else if (percentage >= 50) distribution[2].count++;
      else distribution[3].count++;
    });

    setStats({
      total_evaluations: scores.length,
      average_accuracy: average,
      accuracy_distribution: distribution,
    });
  };

  if (!stats) return null;

  const getBarColor = (range: string) => {
    switch (range) {
      case "90-100%": return "#22c55e"; // green-500
      case "70-89%": return "#84cc16"; // lime-500
      case "50-69%": return "#eab308"; // yellow-500
      default: return "#ef4444"; // red-500
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">
            Model Nøjagtighed
          </h3>
          <p className="text-sm text-gray-500">
            Baseret på {stats.total_evaluations} evalueringer med faktiske karakterer
          </p>
          <p className="text-lg font-semibold mt-2">
            Gennemsnitlig nøjagtighed:{" "}
            <span className="text-primary">
              {(stats.average_accuracy * 100).toFixed(1)}%
            </span>
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.accuracy_distribution}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {stats.accuracy_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
