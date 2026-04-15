import React from 'react';

interface StepWizardProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

const StepWizard: React.FC<StepWizardProps> = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 p-3 mb-4">
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        const canClick = !!onStepClick && (done || active);

        return (
          <React.Fragment key={step}>
            <button
              disabled={!canClick}
              onClick={() => canClick && onStepClick(index)}
              className="flex items-center gap-1 min-w-0 disabled:cursor-default"
            >
              <span
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  done
                    ? 'bg-[#1B3A5C] text-white'
                    : active
                      ? 'bg-[#E8431A] text-white'
                      : 'border border-gray-300 text-gray-500'
                }`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span className={`text-[11px] font-semibold truncate ${active ? 'text-[#E8431A]' : done ? 'text-[#1B3A5C]' : 'text-gray-500'}`}>
                {step}
              </span>
            </button>
            {index < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepWizard;
