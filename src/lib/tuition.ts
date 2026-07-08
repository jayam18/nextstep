export interface ReciprocityRule {
  program: string;
  eligibleStates: string;
  rateType: string;
  rateValue: number | null;
  conditions: string | null;
  sourceUrl: string;
}

export interface TuitionResult {
  tuition: number;
  rule: ReciprocityRule | null;
  isLocal: boolean;
  originalOutOfState?: number;
}

export function getEffectiveTuition(
  college: {
    tuitionInState: number | null;
    tuitionOutOfState: number | null;
    tuition: number;
    location: string;
    reciprocity?: ReciprocityRule[];
  },
  userStateCode: string | null
): TuitionResult {
  const inState = college.tuitionInState !== null ? college.tuitionInState : college.tuition;
  const outOfState = college.tuitionOutOfState !== null ? college.tuitionOutOfState : college.tuition;
  
  if (!userStateCode) {
    return { tuition: outOfState, rule: null, isLocal: false };
  }

  const collegeState = college.location.split(',').pop()?.trim();
  const isLocal = collegeState === userStateCode;

  if (isLocal) {
    return { tuition: inState, rule: null, isLocal: true };
  }

  // Find a matching reciprocity rule
  const rules = college.reciprocity || [];
  const matchingRule = rules.find(rule => {
    if (rule.program === 'none') return false;
    const states = rule.eligibleStates.split(',').map(s => s.trim());
    return states.includes(userStateCode) || rule.eligibleStates === '*';
  });

  if (!matchingRule) {
    return { tuition: outOfState, rule: null, isLocal: false };
  }

  let reciprocityTuition = outOfState;
  if (matchingRule.rateType === 'pct-of-instate' && matchingRule.rateValue) {
    reciprocityTuition = Math.round(inState * (matchingRule.rateValue / 100));
  } else if (matchingRule.rateType === 'flat' && matchingRule.rateValue) {
    reciprocityTuition = matchingRule.rateValue;
  } else if (matchingRule.rateType === 'instate-rate') {
    reciprocityTuition = inState;
  }

  if (reciprocityTuition < outOfState) {
    return { 
      tuition: reciprocityTuition, 
      rule: matchingRule, 
      isLocal: false, 
      originalOutOfState: outOfState 
    };
  }

  return { tuition: outOfState, rule: null, isLocal: false };
}
