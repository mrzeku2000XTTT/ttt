// HiroStudio — re-export of the underlying studio component under the Hiro namespace.
// The studio internals haven't changed, so we wrap rather than duplicate ~740 lines.
import HaruStudio from "@/components/haru/HaruStudio";

export default function HiroStudio(props) {
  return <HaruStudio {...props} />;
}