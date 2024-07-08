import { useState, useEffect, useCallback, useRef } from "react";

type AppLoadProps = {
  isProgressStartAutomatically?: boolean;
  incrementProgressValue?: number;
  /**
   * setIntervalue value i.e. to update the progress value after each interval
   */
  progressInterval?: number;
  /**
   * after progressInterval stopped, how many seconds we should wait to complete the progress
   */
  successLoadedTimeout?: number;
  /**
   * At which progress value we want to stop the progress
   */
  initialStoppedProgressValue?: number;
  /**
   * if true then it will automatically complete the progress after 'successLoadedTimeout'
   * otherwise we have to manually call done()
   */
  isManualProgressCompleted?: boolean;
  /**
   * Callback function when progress is completed
   */
  onProgressCompleted?: () => void;
};

type LoadingStatus = "idle" | "loading" | "paused" | "completed";

export default function useAppLoad(props?: AppLoadProps) {
  const {
    isProgressStartAutomatically = true,
    progressInterval = 500,
    incrementProgressValue = 10,
    successLoadedTimeout = 3000,
    initialStoppedProgressValue = 70,
    isManualProgressCompleted = true,
    onProgressCompleted,
  } = props ?? {};

  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("idle");
  const [stoppedProgressValue, setStoppedProgressValue] = useState(initialStoppedProgressValue);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isProgressStartAutomatically) {
      start();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isProgressStartAutomatically]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (progress >= stoppedProgressValue && isManualProgressCompleted) {
      timeout = setTimeout(() => {
        setIsLoaded(true);
        setProgress(100);
        setLoadingStatus("completed");
        if (onProgressCompleted) {
          onProgressCompleted();
        }
      }, successLoadedTimeout);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [progress, stoppedProgressValue, isManualProgressCompleted, successLoadedTimeout, onProgressCompleted]);

  const _initiateProgress = useCallback(() => {
    setLoadingStatus("loading");
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= stoppedProgressValue) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          setLoadingStatus("paused");
          return prev;
        }

        return prev + incrementProgressValue;
      });
    }, progressInterval);
  }, [incrementProgressValue, progressInterval, stoppedProgressValue]);

  const start = useCallback(() => {
    if (loadingStatus === "paused" || loadingStatus === "idle") {
      _initiateProgress();
    }
  }, [loadingStatus, _initiateProgress]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setLoadingStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (loadingStatus === "paused") {
      _initiateProgress();
    }
  }, [loadingStatus, _initiateProgress]);

  const done = useCallback(() => {
    if (!isManualProgressCompleted) {
      setIsLoaded(true);
      setProgress(100);
      setLoadingStatus("completed");
      if (onProgressCompleted) {
        onProgressCompleted();
      }
    }
  }, [isManualProgressCompleted, onProgressCompleted]);

  return { progress, isLoaded, start, pause, resume, done, loadingStatus, setStoppedProgressValue };
}
