# State Machine Example

A multi-step wizard with validation per step and complex state transitions.

## Use Case

- Onboarding flow with multiple steps
- Each step has its own validation
- Can navigate back and forth
- Final submission combines all data
- Progress indicator shows current step

## File Structure

```
src/apps/onboarding/assets/javascript/setup-wizard/
├── index.tsx
├── SetupWizard.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── useSetupWizard.ts
└── components/
    ├── StepIndicator.tsx
    ├── Step1Account.tsx
    ├── Step2Team.tsx
    ├── Step3Integrations.tsx
    └── Step4Review.tsx
```

## types.ts

```typescript
// Data for each step
export interface AccountData {
    name: string;
    email: string;
    password: string;
}

export interface TeamData {
    teamName: string;
    teamSize: 'small' | 'medium' | 'large';
    industry: string;
}

export interface IntegrationData {
    slack: boolean;
    teams: boolean;
    email: boolean;
}

// Combined data
export interface WizardData {
    account: AccountData;
    team: TeamData;
    integrations: IntegrationData;
}

// Step-specific states with their own data
export type Step =
    | { step: 1; data: Partial<AccountData> }
    | { step: 2; data: Partial<TeamData>; account: AccountData }
    | {
          step: 3;
          data: Partial<IntegrationData>;
          account: AccountData;
          team: TeamData;
      }
    | {
          step: 4;
          account: AccountData;
          team: TeamData;
          integrations: IntegrationData;
      };

// Main model
export type Model =
    | { type: 'InProgress'; current: Step }
    | { type: 'Submitting'; data: WizardData }
    | { type: 'Success' }
    | { type: 'Error'; data: WizardData; error: string };

// Actions
export type Action =
    // Navigation
    | { type: 'NEXT' }
    | { type: 'BACK' }
    | { type: 'GO_TO_STEP'; step: 1 | 2 | 3 | 4 }
    // Field updates
    | { type: 'UPDATE_ACCOUNT'; field: keyof AccountData; value: string }
    | { type: 'UPDATE_TEAM'; field: keyof TeamData; value: string }
    | {
          type: 'UPDATE_INTEGRATION';
          field: keyof IntegrationData;
          value: boolean;
      }
    // Submission
    | { type: 'SUBMIT' }
    | { type: 'SUBMIT_SUCCESS' }
    | { type: 'SUBMIT_ERROR'; error: string }
    | { type: 'RETRY' };
```

## schemas.ts

```typescript
import { z } from 'zod';

export const AccountSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const TeamSchema = z.object({
    teamName: z.string().min(1, 'Team name is required'),
    teamSize: z.enum(['small', 'medium', 'large']),
    industry: z.string().min(1, 'Industry is required'),
});

export const IntegrationSchema = z.object({
    slack: z.boolean(),
    teams: z.boolean(),
    email: z.boolean(),
});

export type AccountData = z.infer<typeof AccountSchema>;
export type TeamData = z.infer<typeof TeamSchema>;
export type IntegrationData = z.infer<typeof IntegrationSchema>;

// Step-specific validation
export function validateStep1(data: Partial<AccountData>) {
    return AccountSchema.safeParse(data);
}

export function validateStep2(data: Partial<TeamData>) {
    return TeamSchema.safeParse(data);
}

export function validateStep3(data: Partial<IntegrationData>) {
    return IntegrationSchema.safeParse(data);
}

// Helper to extract errors
export function getFieldErrors(
    result: z.SafeParseReturnType<any, any>,
): Record<string, string> {
    if (result.success) return {};
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        errors[issue.path.join('.')] = issue.message;
    }
    return errors;
}
```

## hooks/useSetupWizard.ts

```typescript
import { useReducer, useCallback, useMemo } from 'react';
import {
    Model,
    Action,
    Step,
    WizardData,
    AccountData,
    TeamData,
    IntegrationData,
} from '../types';
import {
    validateStep1,
    validateStep2,
    validateStep3,
    getFieldErrors,
} from '../schemas';

const initialStep: Step = { step: 1, data: {} };

function reducer(model: Model, action: Action): Model {
    if (model.type !== 'InProgress') {
        // Handle non-InProgress states
        switch (action.type) {
            case 'RETRY':
                if (model.type === 'Error') {
                    return { type: 'Submitting', data: model.data };
                }
                return model;
            default:
                return model;
        }
    }

    const { current } = model;

    switch (action.type) {
        case 'UPDATE_ACCOUNT': {
            if (current.step !== 1) return model;
            return {
                type: 'InProgress',
                current: {
                    ...current,
                    data: { ...current.data, [action.field]: action.value },
                },
            };
        }

        case 'UPDATE_TEAM': {
            if (current.step !== 2) return model;
            return {
                type: 'InProgress',
                current: {
                    ...current,
                    data: { ...current.data, [action.field]: action.value },
                },
            };
        }

        case 'UPDATE_INTEGRATION': {
            if (current.step !== 3) return model;
            return {
                type: 'InProgress',
                current: {
                    ...current,
                    data: { ...current.data, [action.field]: action.value },
                },
            };
        }

        case 'NEXT': {
            switch (current.step) {
                case 1: {
                    const result = validateStep1(current.data);
                    if (!result.success) return model;
                    return {
                        type: 'InProgress',
                        current: { step: 2, data: {}, account: result.data },
                    };
                }
                case 2: {
                    const result = validateStep2(current.data);
                    if (!result.success) return model;
                    return {
                        type: 'InProgress',
                        current: {
                            step: 3,
                            data: { slack: false, teams: false, email: true },
                            account: current.account,
                            team: result.data,
                        },
                    };
                }
                case 3: {
                    const result = validateStep3(current.data);
                    if (!result.success) return model;
                    return {
                        type: 'InProgress',
                        current: {
                            step: 4,
                            account: current.account,
                            team: current.team,
                            integrations: result.data,
                        },
                    };
                }
                default:
                    return model;
            }
        }

        case 'BACK': {
            switch (current.step) {
                case 2:
                    return {
                        type: 'InProgress',
                        current: { step: 1, data: current.account },
                    };
                case 3:
                    return {
                        type: 'InProgress',
                        current: {
                            step: 2,
                            data: current.team,
                            account: current.account,
                        },
                    };
                case 4:
                    return {
                        type: 'InProgress',
                        current: {
                            step: 3,
                            data: current.integrations,
                            account: current.account,
                            team: current.team,
                        },
                    };
                default:
                    return model;
            }
        }

        case 'GO_TO_STEP': {
            // Only allow going to completed steps
            if (action.step >= current.step) return model;
            // Reconstruct state for that step
            // (simplified - real impl would track all completed data)
            return model;
        }

        case 'SUBMIT': {
            if (current.step !== 4) return model;
            return {
                type: 'Submitting',
                data: {
                    account: current.account,
                    team: current.team,
                    integrations: current.integrations,
                },
            };
        }

        default:
            return model;
    }
}

export function useSetupWizard(teamSlug: string) {
    const [model, dispatch] = useReducer(reducer, {
        type: 'InProgress',
        current: initialStep,
    });

    // Current step validation
    const validation = useMemo(() => {
        if (model.type !== 'InProgress') return { errors: {}, isValid: true };

        const { current } = model;
        switch (current.step) {
            case 1:
                const r1 = validateStep1(current.data);
                return { errors: getFieldErrors(r1), isValid: r1.success };
            case 2:
                const r2 = validateStep2(current.data);
                return { errors: getFieldErrors(r2), isValid: r2.success };
            case 3:
                const r3 = validateStep3(current.data);
                return { errors: getFieldErrors(r3), isValid: r3.success };
            case 4:
                return { errors: {}, isValid: true };
        }
    }, [model]);

    // Actions
    const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
    const back = useCallback(() => dispatch({ type: 'BACK' }), []);

    const updateAccount = useCallback(
        (field: keyof AccountData, value: string) => {
            dispatch({ type: 'UPDATE_ACCOUNT', field, value });
        },
        [],
    );

    const updateTeam = useCallback((field: keyof TeamData, value: string) => {
        dispatch({ type: 'UPDATE_TEAM', field, value });
    }, []);

    const updateIntegration = useCallback(
        (field: keyof IntegrationData, value: boolean) => {
            dispatch({ type: 'UPDATE_INTEGRATION', field, value });
        },
        [],
    );

    const submit = useCallback(async () => {
        if (model.type !== 'InProgress' || model.current.step !== 4) return;

        dispatch({ type: 'SUBMIT' });

        try {
            const csrfToken =
                document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
            const response = await fetch(
                `/a/${teamSlug}/onboarding/api/setup/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    body: JSON.stringify({
                        account: model.current.account,
                        team: model.current.team,
                        integrations: model.current.integrations,
                    }),
                },
            );

            const data = await response.json();
            if (data.success) {
                dispatch({ type: 'SUBMIT_SUCCESS' });
            } else {
                dispatch({ type: 'SUBMIT_ERROR', error: data.error });
            }
        } catch {
            dispatch({
                type: 'SUBMIT_ERROR',
                error: 'Failed to complete setup',
            });
        }
    }, [model, teamSlug]);

    const retry = useCallback(() => dispatch({ type: 'RETRY' }), []);

    return {
        model,
        validation,
        actions: {
            next,
            back,
            updateAccount,
            updateTeam,
            updateIntegration,
            submit,
            retry,
        },
    };
}
```

## components/StepIndicator.tsx

```typescript
import React from 'react'
import { cn } from '@/utilities/shadcn'

interface Props {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function StepIndicator({ currentStep, totalSteps, labels }: Props) {
  return (
    <div className="flex items-center justify-between mb-8">
      {labels.map((label, index) => {
        const step = index + 1
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white',
                  !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? '✓' : step}
              </div>
              <span className="text-xs mt-1">{label}</span>
            </div>

            {step < totalSteps && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-2',
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

## SetupWizard.tsx (Root Component)

```typescript
import React from 'react'
import { useSetupWizard } from './hooks/useSetupWizard'
import { StepIndicator } from './components/StepIndicator'
import { Step1Account } from './components/Step1Account'
import { Step2Team } from './components/Step2Team'
import { Step3Integrations } from './components/Step3Integrations'
import { Step4Review } from './components/Step4Review'
import { Button } from '@/components/ui/button'

interface Props {
  teamSlug: string
}

const STEP_LABELS = ['Account', 'Team', 'Integrations', 'Review']

export default function SetupWizard({ teamSlug }: Props) {
  const { model, validation, actions } = useSetupWizard(teamSlug)

  if (model.type === 'Success') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-green-600">Setup Complete!</h2>
        <p className="mt-2">Redirecting to dashboard...</p>
      </div>
    )
  }

  if (model.type === 'Submitting') {
    return (
      <div className="text-center py-12">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4">Setting up your account...</p>
      </div>
    )
  }

  if (model.type === 'Error') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Setup Failed</h2>
        <p className="mt-2">{model.error}</p>
        <Button onClick={actions.retry} className="mt-4">Try Again</Button>
      </div>
    )
  }

  const { current } = model
  const currentStep = current.step

  return (
    <div className="max-w-2xl mx-auto p-6">
      <StepIndicator
        currentStep={currentStep}
        totalSteps={4}
        labels={STEP_LABELS}
      />

      {currentStep === 1 && (
        <Step1Account
          data={current.data}
          errors={validation.errors}
          onUpdate={actions.updateAccount}
        />
      )}

      {currentStep === 2 && (
        <Step2Team
          data={current.data}
          errors={validation.errors}
          onUpdate={actions.updateTeam}
        />
      )}

      {currentStep === 3 && (
        <Step3Integrations
          data={current.data}
          onUpdate={actions.updateIntegration}
        />
      )}

      {currentStep === 4 && (
        <Step4Review
          account={current.account}
          team={current.team}
          integrations={current.integrations}
        />
      )}

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={actions.back}
          disabled={currentStep === 1}
        >
          Back
        </Button>

        {currentStep < 4 ? (
          <Button onClick={actions.next} disabled={!validation.isValid}>
            Next
          </Button>
        ) : (
          <Button onClick={actions.submit}>
            Complete Setup
          </Button>
        )}
      </div>
    </div>
  )
}
```

## Key Patterns Demonstrated

1. **Step as discriminated union** - Each step carries its own data shape
2. **Progressive data accumulation** - Validated data passes to next step
3. **Per-step validation** - Only current step's fields are validated
4. **Back navigation preserves data** - Can go back without losing input
5. **Final submission combines all** - Step 4 has access to all validated data
6. **Clear visual progress** - Step indicator shows completion state
