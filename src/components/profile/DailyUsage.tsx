
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailyUsageProps {
  userId: string;
}

export function DailyUsage({ userId }: DailyUsageProps) {
  const [usage, setUsage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const MAX_DAILY_USES = 5;

  const fetchDailyUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Try to get existing usage record
      let { data, error } = await supabase
        .from('daily_evaluation_usage')
        .select('count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching daily usage:', error);
        return;
      }

      // If no record exists, create one
      if (!data) {
        const { error: insertError } = await supabase
          .from('daily_evaluation_usage')
          .insert({
            user_id: userId,
            date: today,
            count: 0
          });

        if (insertError) {
          console.error('Error creating usage record:', insertError);
          return;
        }

        data = { count: 0 };
      }

      setUsage(data.count);
    } catch (error) {
      console.error('Error in fetchDailyUsage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyUsage();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('daily_usage_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_evaluation_usage',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchDailyUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const remainingUses = Math.max(0, MAX_DAILY_USES - usage);
  const usagePercentage = (usage / MAX_DAILY_USES) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">Dagens brug</h2>
          <Info className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{remainingUses} evalueringer tilbage i dag</span>
            <span>Nulstilles kl. 00:00</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          <p className="text-sm text-gray-500">
            Du har brugt {usage} af {MAX_DAILY_USES} evalueringer i dag
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
