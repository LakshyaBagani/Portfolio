import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>SDE Intern</h4>
                <h5>Scaler AI Labs</h5>
              </div>
              <h3>NOW</h3>
            </div>
            <p>
              Building RL environments in collaboration with OpenAI, Meta, and xAI
              to train and evaluate large language models. Developing production-grade,
              end-to-end full-stack application clones used as benchmarks for RL
              model training.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>SDE Intern</h4>
                <h5>Trackaroo</h5>
              </div>
              <h3>2025</h3>
            </div>
            <p>
              Built scalable frontend features using React + TypeScript with
              reusable component patterns. Developed secure and modular backend
              APIs using Spring Boot, reducing API response times through
              optimized query design.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h4>Open Source</h4>
                <h5>Jenkins</h5>
              </div>
              <h3>2025</h3>
            </div>
            <p>
              Contributed to the Jenkins core codebase by identifying and fixing
              UI and configuration-related issues. Successfully submitted and got
              pull requests merged after maintainer review. Improved form handling
              logic and compatibility for SCM plugins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
