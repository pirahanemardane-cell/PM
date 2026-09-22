"use client";

import { useEffect, useRef } from "react";

/** شنونده پایدار — بدون رفرش صفحه */
export function useRtEvent(eventName: string, onEvent: () => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    const handler = () => {
      cb.current();
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName]);
}
