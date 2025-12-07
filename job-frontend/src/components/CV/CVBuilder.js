import React, { useEffect, useRef, useState } from 'react';
import './CVBuilder.css';

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const initialCV = {
  header: {
    photo: '',
    name: 'Lê Chiến',
    title: 'Senior Frontend Developer',
    contacts: [
      { label: 'Email', value: 'le.chien@example.com' },
      { label: 'Phone', value: '+84 9xx xxx xxx' },
      { label: 'Location', value: 'Hanoi, Vietnam' }
    ]
  },
  skills: [
    { name: 'JavaScript', level: 90 },
    { name: 'React', level: 88 },
    { name: 'CSS', level: 85 }
  ],
  summary: 'Passionate developer with experience building modern web applications.',
  education: [
    { school: 'Hanoi University', year: '2016 - 2020', degree: 'B.Sc. Computer Science' }
  ],
  experience: [
    { company: 'Awesome Co', year: '2022 - Present', title: 'Frontend Engineer', bullets: ['Built UI components', 'Improved performance'] }
  ]
};

function setIn(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur)) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

export default function CVBuilder() {
  const [cv, setCv] = useState(() => deepClone(initialCV));
  const historyRef = useRef([deepClone(initialCV)]);
  const [currentStep, setCurrentStep] = useState(0);

  const previewRef = useRef(null);
  const toolbarRef = useRef(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  const fileInputRef = useRef(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  // Push new state to history
  const pushState = (next) => {
    const snap = deepClone(next);
    const h = historyRef.current.slice(0, currentStep + 1);
    h.push(snap);
    historyRef.current = h;
    setCurrentStep(h.length - 1);
    setCv(snap);
  };

  // Handlers for undo/redo
  const handleUndo = () => {
    if (currentStep <= 0) return;
    const prevIndex = currentStep - 1;
    setCurrentStep(prevIndex);
    setCv(deepClone(historyRef.current[prevIndex]));
  };
  const handleRedo = () => {
    if (currentStep >= historyRef.current.length - 1) return;
    const nextIndex = currentStep + 1;
    setCurrentStep(nextIndex);
    setCv(deepClone(historyRef.current[nextIndex]));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'Z')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentStep]);

  // Selection-based toolbar
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setToolbarVisible(false);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!previewRef.current) return;
      if (!previewRef.current.contains(range.commonAncestorContainer)) {
        setToolbarVisible(false);
        return;
      }
      // compute position
      const rect = range.getBoundingClientRect();
      const previewRect = previewRef.current.getBoundingClientRect();
      setToolbarPos({
        top: rect.top - previewRect.top - 40 + previewRef.current.scrollTop,
        left: rect.left - previewRect.left + previewRef.current.scrollLeft
      });
      setToolbarVisible(true);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    // after formatting, push state
    // small timeout to allow document to update contentEditable
    setTimeout(() => {
      // find focused editable element and update its data-path
      const el = document.activeElement;
      if (el && el.dataset && el.dataset.path) {
        const path = el.dataset.path;
        const html = el.innerHTML;
        const next = deepClone(cv);
        setIn(next, path, html);
        pushState(next);
      }
    }, 50);
  };

  const handleInput = (e) => {
    const path = e.currentTarget.dataset.path;
    if (!path) return;
    const html = e.currentTarget.innerHTML;
    const next = deepClone(cv);
    setIn(next, path, html);
    pushState(next);
  };

  const handleContactChange = (index, html) => {
    const next = deepClone(cv);
    if (!next.header.contacts[index]) next.header.contacts[index] = { label: '', value: '' };
    next.header.contacts[index].value = html;
    pushState(next);
  };

  const addEducation = () => {
    const next = deepClone(cv);
    next.education.push({ school: 'New School', year: 'Year', degree: '' });
    pushState(next);
  };

  const addExperience = () => {
    const next = deepClone(cv);
    next.experience.push({ company: 'New Company', year: 'Year', title: 'Role', bullets: ['Responsibility'] });
    pushState(next);
  };

  const onPhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTempAvatar(reader.result);
      setShowAvatarPreview(true);
    };
    reader.readAsDataURL(f);
    e.target.value = null;
  };

  const saveAvatar = () => {
    const next = deepClone(cv);
    next.header.photo = tempAvatar;
    setTempAvatar(null);
    setShowAvatarPreview(false);
    pushState(next);
  };

  const cancelAvatar = () => {
    setTempAvatar(null);
    setShowAvatarPreview(false);
  };

  return (
    <div className="app-container">
      <div className="editor-sidebar">
        <div style={{ padding: 16 }}>
          <h3>Design</h3>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => { handleUndo(); }} style={{ marginRight: 8 }}>Undo</button>
            <button onClick={() => { handleRedo(); }}>Redo</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={addEducation}>+ Education</button>
            <button onClick={addExperience} style={{ marginLeft: 8 }}>+ Experience</button>
          </div>
        </div>
      </div>

      <div className="preview-area" ref={previewRef}>
        <div style={{ position: 'relative' }}>
          {toolbarVisible && (
            <div className="floating-toolbar" ref={toolbarRef} style={{ top: toolbarPos.top, left: toolbarPos.left }}>
              <button className="toolbar-btn" onClick={() => execCmd('bold')}>B</button>
              <button className="toolbar-btn" onClick={() => execCmd('italic')}>I</button>
              <button className="toolbar-btn" onClick={() => execCmd('underline')}>U</button>
              <button className="toolbar-btn" onClick={() => {
                const color = prompt('Enter hex color (e.g. #007bff)');
                if (color) execCmd('foreColor', color);
              }}>Color</button>
              <button className="toolbar-btn" onClick={() => {
                const size = prompt('Enter font size in px (e.g. 14)');
                if (size) execCmd('fontSize', 7); // workaround: use fontSize then normalize
              }}>Size</button>
              <button className="toolbar-btn" onClick={() => execCmd('removeFormat')}>Clear</button>
            </div>
          )}

          <div className="cv-container" style={{ marginTop: 10 }}>
            <div className="sidebar">
              <img
                src={cv.header.photo || ''}
                alt="avatar"
                className="photo"
                onClick={onPhotoClick}
                onKeyDown={() => {}}
              />
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

              <h1 className="name" contentEditable suppressContentEditableWarning data-path="header.name" onInput={handleInput}>{cv.header.name}</h1>
              <p className="title" contentEditable suppressContentEditableWarning data-path="header.title" onInput={handleInput}>{cv.header.title}</p>

              <div className="section">
                <h4 className="section-title">Contact</h4>
                {cv.header.contacts.map((c, idx) => (
                  <div key={idx} className="contact-item">
                    <div style={{ flex: 1 }} contentEditable suppressContentEditableWarning data-path={`header.contacts.${idx}.value`} onInput={(e) => handleInput(e)} dangerouslySetInnerHTML={{ __html: c.value }} />
                  </div>
                ))}
              </div>

              <div className="section">
                <h4 className="section-title">Skills</h4>
                {cv.skills.map((s, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div className="skill-bar"><div className="skill-fill" style={{ width: `${s.level}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="main-content">
              <div className="main-section">
                <div className="main-section-title"><span className="main-section-icon" /> Summary</div>
                <div contentEditable suppressContentEditableWarning className="summary" data-path="summary" onInput={handleInput} style={{ minHeight: 60 }}>{cv.summary}</div>
              </div>

              <div className="main-section">
                <div className="main-section-title"><span className="main-section-icon" /> Education</div>
                {cv.education.map((ed, i) => (
                  <div key={i} className="education-item" style={{ marginBottom: 12 }}>
                    <div className="education-header">
                      <div className="education-school" contentEditable suppressContentEditableWarning data-path={`education.${i}.school`} onInput={handleInput}>{ed.school}</div>
                      <div className="education-year" contentEditable suppressContentEditableWarning data-path={`education.${i}.year`} onInput={handleInput}>{ed.year}</div>
                    </div>
                    <div contentEditable suppressContentEditableWarning data-path={`education.${i}.degree`} onInput={handleInput}>{ed.degree}</div>
                  </div>
                ))}
              </div>

              <div className="main-section">
                <div className="main-section-title"><span className="main-section-icon" /> Experience</div>
                {cv.experience.map((ex, i) => (
                  <div key={i} className="experience-item" style={{ marginBottom: 12 }}>
                    <div className="experience-header">
                      <div className="experience-company" contentEditable suppressContentEditableWarning data-path={`experience.${i}.company`} onInput={handleInput}>{ex.company}</div>
                      <div className="experience-year" contentEditable suppressContentEditableWarning data-path={`experience.${i}.year`} onInput={handleInput}>{ex.year}</div>
                    </div>
                    <div className="cv-job-title" contentEditable suppressContentEditableWarning data-path={`experience.${i}.title`} onInput={handleInput}>{ex.title}</div>
                    <ul className="bullet-list">
                      {ex.bullets.map((b, bi) => (
                        <li key={bi} contentEditable suppressContentEditableWarning data-path={`experience.${i}.bullets.${bi}`} onInput={handleInput}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showAvatarPreview && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
              <div style={{ background: 'white', padding: 20, borderRadius: 8, maxWidth: '90%', maxHeight: '90%' }}>
                <h4>Preview Avatar</h4>
                <img src={tempAvatar} alt="preview" style={{ maxWidth: 400, maxHeight: 400 }} />
                <div style={{ marginTop: 12 }}>
                  <button onClick={saveAvatar}>Save</button>
                  <button onClick={cancelAvatar} style={{ marginLeft: 8 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
