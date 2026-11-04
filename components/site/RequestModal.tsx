import { IconArrowUpRight, IconCheck, IconClose } from "./Icons";

/** "Hire me" — composes an email to Lakshya (runtime.ts wires it up) */
export default function RequestModal() {
  return (
    <div className="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle" hidden>
      <div className="modal__panel" id="mPanel">
        <button className="x-btn" id="mClose" aria-label="Close"><IconClose /></button>
        <div id="mForm">
          <div className="mhead"><p>Hire me</p><h2 id="mTitle">Tell me what you&apos;re building.</h2></div>
          <form className="mform" id="reqForm" name="contact">
            <label htmlFor="f-name"><span>Name</span><input id="f-name" name="name" type="text" required maxLength={80} placeholder="Your name" autoComplete="name" /></label>
            <label htmlFor="f-email"><span>Email</span><input id="f-email" name="email" type="email" required maxLength={120} placeholder="you@company.com" autoComplete="email" /></label>
            <label htmlFor="f-company"><span>Company <em>(optional)</em></span><input id="f-company" name="company" type="text" maxLength={80} placeholder="Where you work" autoComplete="organization" /></label>
            <label htmlFor="f-project"><span>What&apos;s the role or project?</span><textarea id="f-project" name="project" rows={4} required maxLength={1500} placeholder="The role, the team and what you'd like me to work on." /></label>
            <div className="mform__bot">
              <small>I reply within one business day.</small>
              <button type="submit" className="pill pill--dark pill--arrow" id="mSend">
                <span className="pill__in" data-h="s 1 1.04" data-hs="320 18" data-ht=".pill"><span id="mSendLbl">Write the email</span>
                  <span className="pill__badge"><IconArrowUpRight /></span>
                </span>
              </button>
            </div>
          </form>
        </div>
        <div className="msuccess" id="mSuccess" role="status" aria-live="polite" hidden>
          <div className="msuccess__badge"><IconCheck /></div>
          <h2 id="mOkT">Almost there</h2>
          <p id="mOkP">Your email app has opened with your message ready to go. Press send there and I&apos;ll reply within one business day.</p>
          <p className="msuccess__alt">Email app didn&apos;t open? Write to <a data-mail="" href="#contact">my email</a>.</p>
          <button className="pill pill--dark" id="mDone"><span className="pill__in" data-h="s 1 1.04" data-hs="320 18" data-ht=".pill">Close</span></button>
        </div>
      </div>
    </div>
  );
}
