import { useProject } from './hooks/useProject';
import { Phase1Setup } from './components/phases/Phase1Setup';
import { Phase2Editor } from './components/phases/Phase2Editor';
import { Phase3Render } from './components/phases/Phase3Render';

function App() {
  const {
    project,
    phase,
    setPhase,
    selectedCharacterId,
    setSelectedCharacterId,
    setMap,
    setDuration,
    setKillerDelay,
    setStartPause,
    setEndPause,
    addCharacter,
    updateCharacter,
    removeCharacter,
    updatePath,
    updatePathPoint,
    getCharacterPath,
    resetProject,
    canProceedToEditor,
    canProceedToRender,
  } = useProject();

  return (
    <>
      {phase === 'setup' && (
        <Phase1Setup
          project={project}
          selectedCharacterId={selectedCharacterId}
          setSelectedCharacterId={setSelectedCharacterId}
          setMap={setMap}
          addCharacter={addCharacter}
          updateCharacter={updateCharacter}
          removeCharacter={removeCharacter}
          canProceedToEditor={canProceedToEditor}
          onNext={() => setPhase('editor')}
        />
      )}

      {phase === 'editor' && (
        <Phase2Editor
          project={project}
          selectedCharacterId={selectedCharacterId}
          setSelectedCharacterId={setSelectedCharacterId}
          updatePath={updatePath}
          updatePathPoint={updatePathPoint}
          getCharacterPath={getCharacterPath}
          setDuration={setDuration}
          setKillerDelay={setKillerDelay}
          setStartPause={setStartPause}
          setEndPause={setEndPause}
          canProceedToRender={canProceedToRender}
          onBack={() => setPhase('setup')}
          onNext={() => setPhase('render')}
        />
      )}

      {phase === 'render' && (
        <Phase3Render
          project={project}
          getCharacterPath={getCharacterPath}
          onBack={() => setPhase('editor')}
          onReset={resetProject}
        />
      )}
    </>
  );
}

export default App;
