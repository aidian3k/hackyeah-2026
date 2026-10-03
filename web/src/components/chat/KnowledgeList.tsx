import { Link } from "react-router-dom";
import type { SolutionCard } from "@/api/types";
import { CategoryTag } from "@/components/CategoryTag";

interface Props {
  items: SolutionCard[];
}

/**
 * Wiedza o problemie (kind = KNOWLEDGE). To nie są rozwiązania: bez numerów,
 * bez cytowań i bez poziomu sprawdzenia.
 */
export function KnowledgeList({ items }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="knowledge-list ds-stack" aria-labelledby="wiedza-naglowek">
      <div className="knowledge-list__head">
        <h3 id="wiedza-naglowek">Co wiemy o tym problemie</h3>
        <p className="knowledge-list__note">Opracowania i dane, które pomagają zrozumieć sytuację. To nie są gotowe rozwiązania.</p>
      </div>
      <ul className="knowledge-list__items">
        {items.map((item) => (
          <li key={item.id} className="ds-card ds-stack knowledge-item">
            {item.category && (
              <div>
                <CategoryTag code={item.category} label={item.category_label_pl} />
              </div>
            )}
            <h4 className="knowledge-item__title">
              <Link to={`/rozwiazania/${item.id}`}>{item.title}</Link>
            </h4>
            {item.summary && <p>{item.summary}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
