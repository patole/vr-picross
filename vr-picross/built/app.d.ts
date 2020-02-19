/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Context } from '@microsoft/mixed-reality-extension-sdk';
export default class PicrossApp {
    private context;
    private baseUrl;
    constructor(context: Context, baseUrl: string);
    private CubeAssets;
    private WhiteSolidMaterial;
    private BlackSolidMaterial;
    private GreyTransparentMaterial;
    private CubeMesh;
    private InputControlCube;
    private InputControlCubeText;
    private GameBoard;
    private HorizontalHints;
    private VerticalHints;
    private CurrentSolution;
    private CurrentWidth;
    private CurrentHeight;
    private CurrentInputState;
    private started;
    private CreateGameBoard;
    private SetCubeState;
    private UpdateControlText;
    private AnimateActorLocalRotation;
    private FillInAnimation;
    private ResetAnimation;
    private RuleOutAnimation;
}
//# sourceMappingURL=app.d.ts.map