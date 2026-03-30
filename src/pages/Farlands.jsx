export default function Farlands() {
  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <img
          src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/aed96ea56_generated_image.png"
          alt="Farlands Logo"
          className="w-16 h-16 object-contain drop-shadow-lg"
        />
      </div>
      <iframe
        src="https://farlands.world"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera"
        allowFullScreen
        title="Farlands"
      />
    </div>
  );
}