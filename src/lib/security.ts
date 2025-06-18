import { supabase } from './supabase';
import * as tf from '@tensorflow/tfjs';
import { toast } from 'sonner';

interface SecurityMetrics {
  anomalyScore: number;
  threatLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private model: tf.LayersModel | null = null;
  private anomalyThreshold = 0.8;

  private constructor() {
    this.initializeModel();
    this.startMonitoring();
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  private async initializeModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 64, activation: 'relu', inputShape: [10] }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
  }

  private startMonitoring() {
    setInterval(async () => {
      await this.checkSecurityMetrics();
    }, 60000); // Check every minute
  }

  private async checkSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const { data: metrics, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('ts', { ascending: false })
        .limit(10);

      if (error) throw error;

      const tensor = tf.tensor2d(metrics.map(this.preprocessMetrics));
      const prediction = this.model?.predict(tensor) as tf.Tensor;
      const anomalyScore = prediction.dataSync()[0];

      const threatLevel = this.determineThreatLevel(anomalyScore);
      const recommendations = this.generateRecommendations(threatLevel, metrics);

      if (anomalyScore > this.anomalyThreshold) {
        this.handleSecurityAlert(anomalyScore, metrics);
      }

      return {
        anomalyScore,
        threatLevel,
        recommendations
      };
    } catch (error) {
      console.error('Security check failed:', error);
      throw error;
    }
  }

  private preprocessMetrics(metric: any): number[] {
    return [
      metric.cpu_usage || 0,
      metric.memory_usage || 0,
      metric.request_rate || 0,
      metric.error_rate || 0,
      metric.latency || 0,
      metric.auth_failures || 0,
      metric.suspicious_ips || 0,
      metric.data_access_rate || 0,
      metric.api_calls || 0,
      metric.system_load || 0
    ];
  }

  private determineThreatLevel(anomalyScore: number): 'low' | 'medium' | 'high' {
    if (anomalyScore > 0.8) return 'high';
    if (anomalyScore > 0.5) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    threatLevel: string,
    metrics: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.find(m => m.auth_failures > 5)) {
      recommendations.push('Review authentication logs and implement rate limiting');
    }

    if (metrics.find(m => m.suspicious_ips > 0)) {
      recommendations.push('Block suspicious IP addresses and update firewall rules');
    }

    if (metrics.find(m => m.error_rate > 0.1)) {
      recommendations.push('Investigate high error rates in system logs');
    }

    return recommendations;
  }

  private async handleSecurityAlert(anomalyScore: number, metrics: any[]) {
    try {
      // Log security alert
      await supabase
        .from('security_alerts')
        .insert({
          anomaly_score: anomalyScore,
          metrics: metrics,
          timestamp: new Date().toISOString()
        });

      // Notify administrators
      toast.error('Security Alert: Unusual system behavior detected');

      // Implement automatic response actions
      if (anomalyScore > 0.9) {
        await this.implementEmergencyMeasures();
      }
    } catch (error) {
      console.error('Failed to handle security alert:', error);
    }
  }

  private async implementEmergencyMeasures() {
    try {
      // Implement emergency security measures
      await supabase.rpc('enable_emergency_security_measures');
      
      toast.error('Emergency security measures activated');
    } catch (error) {
      console.error('Failed to implement emergency measures:', error);
    }
  }

  async validateRequest(
    request: any,
    context: any
  ): Promise<boolean> {
    try {
      // Validate request parameters
      if (!this.validateParameters(request)) {
        return false;
      }

      // Check rate limits
      if (!await this.checkRateLimits(context)) {
        return false;
      }

      // Validate authentication
      if (!await this.validateAuthentication(request)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Request validation failed:', error);
      return false;
    }
  }

  private validateParameters(request: any): boolean {
    // Implement parameter validation logic
    return true;
  }

  private async checkRateLimits(context: any): Promise<boolean> {
    // Implement rate limiting logic
    return true;
  }

  private async validateAuthentication(request: any): Promise<boolean> {
    // Implement authentication validation logic
    return true;
  }
}

export const securityMonitor = SecurityMonitor.getInstance();