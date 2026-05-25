import { CheckCircle } from "lucide-react";

export const RegistrationProgress = ({ step, steps }) => {
  return (
    <div className="px-6 pb-4 bg-primary-600">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const isCompleted = step > i + 1;
          const isActive = step === i + 1;
          return (
            <div key={i} className="flex-1 text-center relative">
              <div
                className={`
                  w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold
                  ${isCompleted ? "bg-white text-primary-600" : ""}
                  ${isActive ? "bg-white text-primary-600 ring-4 ring-white/30" : ""}
                  ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}
                `}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <p
                className={`text-xs mt-2 ${isActive ? "text-white font-medium" : "text-white/50"}`}
              >
                {s}
              </p>
              {i < steps.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2
                    ${isCompleted ? "bg-white" : "bg-white/30"}`}
                  style={{
                    width: "calc(100% - 2rem)",
                    left: "calc(50% + 1rem)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
