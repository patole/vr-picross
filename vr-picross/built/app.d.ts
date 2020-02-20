/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Context } from '@microsoft/mixed-reality-extension-sdk';
export default class PicrossApp {
    private context;
    private baseUrl;
    constructor(context: Context, baseUrl: string);
    private SceneActors;
    private SceneEffects;
    private CubeAssets;
    private WhiteSolidMaterial;
    private BlackSolidMaterial;
    private GreyTransparentMaterial;
    private TransparentMaterial;
    private CubeMesh;
    private StartCube;
    private StartText;
    private EditCube;
    private EditText;
    private TutorialCube;
    private TutorialText;
    private Banner;
    private InputControlCube;
    private InputControlCubeText;
    private MainMenuCube;
    private MainMenuText;
    private SaveCube;
    private SaveText;
    private VictoryText;
    private CurrentPuzzleSet;
    private PuzzleIndex;
    private VictoryCondition;
    private GameBoard;
    private HorizontalHints;
    private VerticalHints;
    private CurrentWidth;
    private CurrentHeight;
    private CurrentInputState;
    private EditMode;
    private CreateMainMenu;
    private DestroyScene;
    private started;
    private SetupStarterPicrossSet;
    private SetupTutorialPicrossSet;
    private SetupChallenge;
    private ResetVictoryCondition;
    private DefaultVictoryCondition;
    private EditGame;
    private StartGame;
    private CreateSaveCube;
    private UpdateVictoryFromBoard;
    private UpdateBoardFromVictory;
    private CreateInGameInputControl;
    private CreateMainMenuControl;
    private DestroyHints;
    private DestroyGameBoard;
    private CreateGameBoard;
    private CreateEditInputControl;
    private SetupEditUI;
    private SetupMainGameUI;
    private CreateHint;
    private CreateHints;
    private CheckVictoryPattern;
    private CheckVictoryBlackout;
    private CreateVictoryText;
    private CreateVictoryAnimation;
    private SetCubeState;
    private UpdateControlText;
    private AnimateActorLocalRotation;
    private FillInAnimation;
    private ResetAnimation;
    private RuleOutAnimation;
}
//# sourceMappingURL=app.d.ts.map