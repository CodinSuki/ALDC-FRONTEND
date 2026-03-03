import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import AgentForm from './AgentForm';
import BrokerForm from './BrokerForm';
import StaffForm from './StaffForm';

type PersonnelType = 'agents' | 'brokers' | 'staff';

type PersonnelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: PersonnelType;
  formData: any;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const titleByType: Record<PersonnelType, string> = {
  agents: 'Add New Agent',
  brokers: 'Add New Broker',
  staff: 'Add New Staff',
};

const descriptionByType: Record<PersonnelType, string> = {
  agents: 'Fill in the details to add a new agent',
  brokers: 'Fill in the details to add a new broker',
  staff: 'Fill in the details to add a new staff member',
};

const submitLabelByType: Record<PersonnelType, string> = {
  agents: 'Add Agent',
  brokers: 'Add Broker',
  staff: 'Add Staff',
};

export default function PersonnelDialog({
  open,
  onOpenChange,
  type,
  formData,
  onChange,
  onSubmit,
  onCancel,
}: PersonnelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titleByType[type]}</DialogTitle>
          <DialogDescription>{descriptionByType[type]}</DialogDescription>
        </DialogHeader>

        {type === 'agents' && <AgentForm formData={formData} onChange={onChange} />}
        {type === 'brokers' && <BrokerForm formData={formData} onChange={onChange} />}
        {type === 'staff' && <StaffForm formData={formData} onChange={onChange} />}

        <DialogFooter>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {submitLabelByType[type]}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
