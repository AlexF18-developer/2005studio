import { CheckCircle2, Clock, PackageCheck, Truck, XCircle } from 'lucide-react';
import { STATUS, STEPS } from '../../lib/orderStatus';

const ICONS = [Clock, CheckCircle2, Truck, PackageCheck];

export default function OrderTimeline({ status }) {
  if (status === 'cancelado') {
    return <div className="alert alert-danger"><XCircle size={18} /> Este pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.</div>;
  }
  const step = STATUS[status]?.step ?? 0;
  return (
    <div className="timeline" style={{ '--progress': `${(step / (STEPS.length - 1)) * 100}%` }}>
      <div className="timeline-bar"><span /></div>
      {STEPS.map((label, i) => {
        const Icon = ICONS[i];
        return (
          <div key={label} className={`tl-step ${i <= step ? 'done' : ''} ${i === step ? 'current' : ''}`}>
            <span className="tl-dot"><Icon size={18} /></span>
            <span className="tl-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
