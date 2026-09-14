import { forwardRef } from "react";

export const HeroVideo = forwardRef<HTMLVideoElement>(function HeroVideo(
  _props,
  ref,
) {
  // Pas d'`autoPlay` : l'image reste figée sur le poster et la lecture ne
  // démarre qu'au survol (voir InteractiveVideoCard), sinon la vidéo capte
  // toute l'attention de la page.
  return (
    <video
      ref={ref}
      className="h-full w-full rounded-lg object-cover"
      src="/media/windy-morning-fields.mp4"
      poster="/media/windy-morning-fields-poster.jpg"
      preload="metadata"
      loop
      muted
      playsInline
      disablePictureInPicture
      disableRemotePlayback
    />
  );
});
