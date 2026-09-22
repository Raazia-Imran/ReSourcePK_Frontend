import {
  ArrowRight,
  Check,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Brand from "../components/Brand";
import MaterialLoom from "../components/MaterialLoom";
import { steps, valueCards } from "../content/siteContent";
export default function Home() {
  return (
    <div className="landing">
      <Header />
      <main>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">
              <Sparkles size={15} /> Pakistan’s textile value loop
            </p>
            <h1>
              Turn surplus
              <br />
              into <span>momentum.</span>
            </h1>
            <p className="hero__lead">
              A B2B marketplace where textile deadstock finds its next
              buyer—through direct orders or pooled demand built for smaller
              businesses.
            </p>
            <div className="hero__actions">
              <Link className="button" to="/signup">
                Start circulating <ArrowRight />
              </Link>
              <a className="text-link" href="#how">
                See how it works <span>↓</span>
              </a>
            </div>
            <div className="hero__proof">
              <span>
                <Check /> MOQ-aware buying
              </span>
              <span>
                <Check /> Verified organizations
              </span>
              <span>
                <Check /> Traceable impact
              </span>
            </div>
          </div>
          <MaterialLoom />
        </section>
        <section className="ticker" aria-label="Platform capabilities">
          <div>
            SELLER CONTROL <i /> POOLED DEMAND <i /> DIRECT PURCHASE <i />{" "}
            MATERIAL PASSPORT <i /> ROLE-BASED OPERATIONS <i /> SELLER CONTROL{" "}
            <i /> POOLED DEMAND
          </div>
        </section>
        <section className="section intro" id="how">
          <div>
            <p className="eyebrow">A market designed around real constraints</p>
            <h2>
              Stored material is
              <br />
              <span>working capital.</span>
            </h2>
          </div>
          <p className="section-lead">
            ReSource PK connects factory-scale supply with flexible demand
            without hiding minimum quantities, ownership, or fulfillment
            responsibility.
          </p>
        </section>
        <section className="value-grid">
          {valueCards.map((card) => (
            <article className="value-card" key={card.mark}>
              <span>{card.mark}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </section>
        <section className="model-section" id="model">
          <div className="model-visual">
            <div className="lot lot--large">
              <span>Factory lot</span>
              <strong>50 kg</strong>
            </div>
            <div className="lot-row">
              <div className="lot">
                <span>Buyer A</span>
                <strong>15 kg</strong>
              </div>
              <div className="lot">
                <span>Buyer B</span>
                <strong>20 kg</strong>
              </div>
              <div className="lot">
                <span>Buyer C</span>
                <strong>15 kg</strong>
              </div>
            </div>
          </div>
          <div className="model-copy">
            <p className="eyebrow">Two ways to complete a lot</p>
            <h2>
              One inventory.
              <br />
              Flexible demand.
            </h2>
            <p>
              A buyer can purchase the full eligible quantity immediately. When
              the seller’s MOQ is larger, several buyers can commit portions to
              the same protected pool.
            </p>
            <ul>
              <li>
                <Layers3 /> Seller controls lot and minimum rules
              </li>
              <li>
                <ShieldCheck /> Separate states for direct and pooled orders
              </li>
              <li>
                <Sparkles /> Clear progress before a pool converts
              </li>
            </ul>
          </div>
        </section>
        <section className="steps" id="trust">
          <div className="steps__head">
            <p className="eyebrow">From warehouse to reuse</p>
            <h2>A clear chain of action.</h2>
          </div>
          {steps.map(([title, text], i) => (
            <article key={title}>
              <b>0{i + 1}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
        <section className="closing">
          <p className="eyebrow">Built for Pakistan’s textile ecosystem</p>
          <h2>
            Move material.
            <br />
            <em>Recover value.</em>
          </h2>
          <Link className="button button--light" to="/signup">
            Create your account <ArrowRight />
          </Link>
        </section>
      </main>
      <footer>
        <Brand light />
        <p>Textile deadstock, recirculated with clarity.</p>
        <span>© {new Date().getFullYear()} ReSource PK</span>
      </footer>
    </div>
  );
}
