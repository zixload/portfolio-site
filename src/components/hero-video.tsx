export function HeroVideo() {
  return (
    <video
      className="h-full w-full rounded-lg object-cover"
      style={{ animation: "ambientDrift 20s ease-in-out infinite" }}
      src="/media/windy-morning-fields.mp4"
      poster="/media/windy-morning-fields-poster.jpg"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}
