"use client";

import { useState, type SyntheticEvent } from "react";
import { experienceConfig } from "@/config/experience";


export function CreationMedia({ enabled, reducedMotion }: { enabled: boolean; reducedMotion: boolean }) {
  const { assets } = experienceConfig;
  const [attempt, setAttempt] = useState(0);
  const hasVideo = Boolean(assets.handsVideoDesktop || assets.handsVideoMobile);


  const onVideoError = (event: SyntheticEvent<HTMLVideoElement>) => {
    event.currentTarget.dataset.scrubReady = "false";
    // Retry once, then use the original encode. Never leave a failed decoder mounted.
    console.warn("Creation film load failed; recovering.", {
      source: event.currentTarget.currentSrc, code: event.currentTarget.error?.code, attempt,
    });
    setAttempt((current) => Math.min(current + 1, 3));
  };

  return (
    <div className="creation-media" aria-hidden="true" style={{ backgroundImage: "url(/assets/humanxmachine.b1258adc36a0.poster.png)", backgroundSize: "cover", backgroundPosition: "center" }}>
      {hasVideo && enabled && !reducedMotion && attempt < 3 ? (
        <video
          key={attempt}
          className="creation-video"
          muted
          playsInline
          preload="auto"
          data-scroll-video
          poster="/assets/humanxmachine.b1258adc36a0.poster.png"
          onError={onVideoError}
        >
          {attempt < 2 && assets.handsVideoMobile ? <source src={attempt === 1 ? `${assets.handsVideoMobile}?retry=1` : assets.handsVideoMobile} media="(max-width: 700px)" type="video/mp4" /> : null}
          {assets.handsVideoDesktop ? <source src={attempt === 2 ? "/assets/humanxmachine.b1258adc36a0.mp4" : attempt === 1 ? `${assets.handsVideoDesktop}?retry=1` : assets.handsVideoDesktop} type="video/mp4" /> : null}
        </video>
      ) : null}
      <div className="creation-video-veil" aria-hidden="true" />
    </div>
  );
}
