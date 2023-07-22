import { useEffect, useRef, useState } from 'react';

interface useThrottleStateTypes {
  state: any,
  options: {
    wait: number,
  },
}

const DEFAULT_PROPS = {
  state: null,
  options: {
    wait: 0,
  },
};

function useThrottleState(props: useThrottleStateTypes) {
  const {
    state,
    options,
  } = props;

  const [throttleState, setThrottleState] = useState<any>(null);
  const { current } = useRef<{timer: NodeJS.Timeout | null}>({timer: null});

  useEffect(() => {
    if (!current?.timer) {
      current.timer = setTimeout(() => {
        setThrottleState(state);
        current.timer && clearTimeout(current.timer);
        current.timer = null;
      }, options?.wait);
    }
  }, [state, options?.wait]);

  return throttleState;
}

useThrottleState.defaultProps = DEFAULT_PROPS;

export default useThrottleState;