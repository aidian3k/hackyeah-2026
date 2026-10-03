import { youtubeEmbedUrl } from "@/lib/media";
import "@/styles/components.css";

interface Props {
  videoId: string;
  title: string;
}

/** Film YouTube (youtube-nocookie) w kontenerze 16:9 + link do YouTube pod spodem. */
export function VideoEmbed({ videoId, title }: Props) {
  return (
    <figure className="video-embed ds-stack">
      <div className="ds-video">
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={`Film: ${title}`}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <figcaption>
        <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noopener noreferrer">
          Otwórz film w YouTube<span className="ds-sr-only"> (otwiera się w nowej karcie)</span>
        </a>
      </figcaption>
    </figure>
  );
}
