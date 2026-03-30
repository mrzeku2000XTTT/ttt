export default function Farlands() {
  return (
    <div className="fixed inset-0 bg-black">
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