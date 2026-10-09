import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { startCheckout } from '../lib/billing';

interface PaymentFormProps {
  plan?: 'monthly' | 'yearly';
  onError?: (error: Error) => void;
}

// Payments happen on PayPal's own approval page, so card and bank details never touch this app.
export const PaymentForm = ({ plan = 'monthly', onError }: PaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await startCheckout(plan);
    } catch (e) {
      toast.error((e as Error).message);
      onError?.(e as Error);
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={isLoading} className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {isLoading ? 'Redirecting…' : 'Upgrade to Pro'}
    </button>
  );
};

export default PaymentForm;
