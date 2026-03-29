"use client";
import { useEffect } from "react";

export default function ScoreUpdater() {
  useEffect(() => {
    fetch("/api/clients/update-scores").catch(console.error);
  }, []);
  return null;
}
