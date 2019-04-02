import React, { useState, useEffect } from 'react';
import ValueSubscription from '../../lib/ValueSubscription';
import { evaluationProgress, EvaluationProgress } from '../../evaluate';
import './LoadingBar.css';

const SHOW_AFTER_DURATION = 1500;

const LoadingBar = () => {
  const [isPastDuration, setPastDuration] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setPastDuration(true);
    }, SHOW_AFTER_DURATION);
  }, [isPastDuration]);
  return (
    <ValueSubscription source={evaluationProgress}>
      {progress =>
        progress === EvaluationProgress.IN_PROGRESS && isPastDuration ? (
          <div className="monaco-progress-container active infinite">
            <div
              className="progress-bit"
              style={{
                backgroundColor: '#0E70C0',
                opacity: 1,
              }}
            />
          </div>
        ) : null
      }
    </ValueSubscription>
  );
};

export default LoadingBar;
