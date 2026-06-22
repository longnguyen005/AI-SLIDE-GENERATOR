import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/SideBar/SideBar';
import ProgressSteps from '../../components/ProgressSteps/ProgressSteps';
import OutlineCard from '../../components/OutlineCard/OutlineCard';
import Button from '../../components/Button/Button';
import Icon from '../../components/Icon/Icon';
import './OutlinePage.css';

const sections = [
  ['Introduction to AI in Pedagogy', ['- Historical context of automation in education', '- Definition of LLMs and Generative AI for academic use', '- Current market penetration of AI tools in universities']],
  ['Personalized Learning Pathways', ['- Adaptive curriculum based on student performance', '- Real-time feedback loops for 24/7 student support', '- Case studies of flipped classrooms using AI assistants']],
  ['Ethical Considerations & AI Policy', ['- Academic integrity and the AI arms race', '- Data privacy for student interactions with AI', '- Developing a school-wide AI ethics framework']],
  ['Faculty Enablement and Change', ['- Practical professional development for educators', '- Redesigning assessment and classroom workflows', '- Measuring adoption and learning outcomes']],
];

export default function OutlinePage() {
  const navigate = useNavigate();
  return (
    <div className="page-shell outline-page">
      <Sidebar active="outline" />
      <main className="outline-main">
        <header className="outline-header">
          <div><h1>Outline Editor</h1><p>✦ AI in Higher Education</p></div>
          <div className="outline-header__people"><span>JD</span><span>MK</span><span>+3</span></div>
          <Button iconRight="arrowRight" onClick={() => navigate('/preview')}>Generate Slides</Button>
        </header>
        <ProgressSteps active={2} />
        <section className="outline-list">
          {sections.map(([title, points], index) => <OutlineCard key={title} number={index + 1} title={title} points={points} />)}
        </section>
        <footer className="outline-sticky">
          <div><strong>5 sections</strong><small>Estimated 12 slides</small></div>
          <span><Icon name="clock" size={18} /> Last edited 2m ago</span>
          <Button variant="outline" icon="back" onClick={() => navigate('/create')}>Back to Topic</Button>
          <Button icon="wand" onClick={() => navigate('/preview')}>Generate Slides</Button>
        </footer>
      </main>
    </div>
  );
}
