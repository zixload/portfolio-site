import { forwardRef } from "react";

export const HeroVideo = forwardRef<HTMLVideoElement>(function HeroVideo(
  _props,
  ref,
) {
  return (
    <video
      ref={ref}
      className="h-full w-full rounded-lg object-cover"
      style={{ animation: "ambientDrift 20s ease-in-out infinite" }}
      src="/media/windy-morning-fields.mp4"
      poster="/media/windy-morning-fields-poster.jpg"
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
    />
  );
});
