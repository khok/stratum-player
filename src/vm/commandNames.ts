const arr = [
    null,
    {
        "name": "push",
        "args": ""
    },
    {
        "name": "push_new",
        "args": ""
    },
    {
        "name": "push",
        "args": ""
    },
    {
        "name": "push_new",
        "args": ""
    },
    {
        "name": "push_cst",
        "args": ""
    },
    {
        "name": "push_cst",
        "args": ""
    },
    null,
    null,
    null,
    {
        "name": ":=_old",
        "args": "FLOAT,FLOAT"
    },
    {
        "name": ":=",
        "args": "FLOAT,FLOAT"
    },
    {
        "name": ":=_old",
        "args": "INTEGER,INTEGER"
    },
    {
        "name": ":=",
        "args": "INTEGER,INTEGER"
    },
    null,
    null,
    {
        "name": "RGBf",
        "args": "FLOAT ret COLORREF"
    },
    {
        "name": "FLOAT",
        "args": "COLORREF ret FLOAT"
    },
    {
        "name": "+",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "-",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "/",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "*",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "%",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "tan",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "arctan",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "sin",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "arcsin",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "cos",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "arccos",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "ln",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "lg",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "log",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "^",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "exp",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "sqrt",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "sqr",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "ed",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "delta",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "max",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "min",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "average",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "round",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "rnd",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "and",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "or",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "not",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "abs",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "sgn",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "rad",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "deg",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "Stop",
        "args": "FLOAT"
    },
    {
        "name": "jmp",
        "args": ""
    },
    {
        "name": "jnz",
        "args": "FLOAT"
    },
    {
        "name": "jz",
        "args": "FLOAT"
    },
    {
        "name": "==",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "!=",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": ">",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": ">=",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "<",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "<=",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MCreate",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MDelete",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MFill",
        "args": "FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MGet",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MPut",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MEditor",
        "args": "FLOAT,FLOAT"
    },
    {
        "name": "MDiag",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MAddX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MSubX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MDivX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MMulX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MDet",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MDelta",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MEd",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MTransp",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MAddC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MNot",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MSum",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MSubC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MMulC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "trunc",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "CloseAll",
        "args": ""
    },
    {
        "name": "==",
        "args": "INTEGER,INTEGER ret FLOAT"
    },
    {
        "name": "!=",
        "args": "COLORREF,COLORREF ret FLOAT"
    },
    {
        "name": "ed",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "&&",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "||",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "not",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "NotBin",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "SetCrdSystem2d",
        "args": "HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "MDivC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MMul",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MGlue",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MCut",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MMove",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MObr",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "MDim",
        "args": "FLOAT,&FLOAT,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "Xor",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "XorBin",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "ChooseFolderDialog",
        "args": "STRING,STRING,FLOAT ret STRING  "
    },
    {
        "name": "MSaveAs",
        "args": "FLOAT,STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "MLoad",
        "args": "FLOAT,STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "FileSaveDialog",
        "args": "STRING,STRING,STRING ret STRING  "
    },
    {
        "name": "FileLoadDialog",
        "args": "STRING,STRING,STRING ret STRING  "
    },
    {
        "name": "CreateObjectFromFile2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "&",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "|",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "Quit",
        "args": "FLOAT"
    },
    null,
    null,
    {
        "name": "jnz",
        "args": "HANDLE"
    },
    {
        "name": "jz",
        "args": "HANDLE"
    },
    {
        "name": "SetStatusText",
        "args": "FLOAT,STRING"
    },
    {
        "name": "un_minus",
        "args": "FLOAT ret FLOAT"
    },
    null,
    {
        "name": "gettickcount",
        "args": ""
    },
    {
        "name": "<<",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": ">>",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    null,
    {
        "name": "Change",
        "args": "STRING,STRING,STRING ret STRING"
    },
    {
        "name": "push",
        "args": ""
    },
    {
        "name": "push_new",
        "args": ""
    },
    {
        "name": "push_cst",
        "args": ""
    },
    {
        "name": ":=",
        "args": "STRING,STRING"
    },
    {
        "name": "+",
        "args": "STRING,STRING ret STRING"
    },
    {
        "name": "Left",
        "args": "STRING,FLOAT ret STRING"
    },
    {
        "name": "Right",
        "args": "STRING,FLOAT ret STRING"
    },
    {
        "name": "Substr",
        "args": "STRING,FLOAT,FLOAT ret STRING"
    },
    {
        "name": "Pos",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "Replicate",
        "args": "STRING,FLOAT ret STRING"
    },
    {
        "name": "Lower",
        "args": "STRING ret STRING"
    },
    {
        "name": "Upper",
        "args": "STRING ret STRING"
    },
    {
        "name": "Ansi_To_Oem",
        "args": "STRING ret STRING"
    },
    {
        "name": "Oem_To_Ansi",
        "args": "STRING ret STRING"
    },
    {
        "name": "Compare",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "Comparei",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "Length",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "Ltrim",
        "args": "STRING ret STRING"
    },
    {
        "name": "Rtrim",
        "args": "STRING ret STRING"
    },
    {
        "name": "Alltrim",
        "args": "STRING ret STRING"
    },
    {
        "name": "ASCII",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "Chr",
        "args": "FLOAT ret STRING"
    },
    {
        "name": "String",
        "args": "FLOAT ret STRING"
    },
    {
        "name": "Float",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "==",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "!=",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": ">",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": ">=",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "<",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "<=",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "RGB",
        "args": "FLOAT,FLOAT,FLOAT ret COLORREF"
    },
    {
        "name": "system",
        "args": "FLOAT,[FLOAT] ret FLOAT"
    },
    {
        "name": "systemstr",
        "args": "FLOAT ret STRING"
    },
    {
        "name": "RegisterObject",
        "args": "HANDLE,HANDLE,STRING,FLOAT,FLOAT"
    },
    {
        "name": "UnregisterObject",
        "args": "HANDLE,STRING,FLOAT"
    },
    {
        "name": "SetCapture",
        "args": "HANDLE,STRING,FLOAT"
    },
    {
        "name": "ReleaseCapture",
        "args": ""
    },
    {
        "name": ":=_old",
        "args": "STRING,STRING"
    },
    {
        "name": "GetMousePos",
        "args": "STRING,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "InputBox",
        "args": "STRING,STRING,STRING ret STRING  "
    },
    {
        "name": "MessageBox",
        "args": "STRING,STRING,FLOAT  ret FLOAT   "
    },
    {
        "name": "CreateStream",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    {
        "name": "CloseStream",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Seek",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "StreamStatus",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Eof",
        "args": "HANDLE ret FLOAT"
    },
    null,
    {
        "name": "Getpos",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "GetSize",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SetWidth",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "Read",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "ReadLn",
        "args": "HANDLE ret STRING"
    },
    {
        "name": "Write",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "WriteLn",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "GetLine",
        "args": "HANDLE,FLOAT,STRING ret STRING"
    },
    {
        "name": "CopyBlock",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "Truncate",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "randomize",
        "args": "FLOAT "
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "CreateObjectFromFile3d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    {
        "name": "Shell",
        "args": "STRING,STRING,STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "RGBEx",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT ret COLORREF"
    },
    {
        "name": "LoadSpacewindow",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    {
        "name": "OpenSchemeWindow",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    {
        "name": "CloseWindow",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetWindowName",
        "args": "HANDLE ret STRING"
    },
    {
        "name": "GetWindowSpace",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "SetClientSize",
        "args": " STRING,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetWindowTitle",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "GetWindowTitle",
        "args": "STRING ret STRING"
    },
    {
        "name": "ShowWindow",
        "args": "STRING,FLOAT ret FLOAT"
    },
    {
        "name": "SetWindowPos",
        "args": "STRING,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetWindowOrg",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetWindowSize",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "IswindowVisible",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "IsIconic",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "IsWindowExist",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "BringWindowToTop",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "CascadeWindows",
        "args": ""
    },
    {
        "name": "Tile",
        "args": "FLOAT"
    },
    {
        "name": "ArrangeIcons",
        "args": ""
    },
    {
        "name": "GetWindowOrgX",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetWindowOrgY",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetWindowWidth",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetWindowHeight",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GethObject",
        "args": ""
    },
    {
        "name": "GetObject2dByName",
        "args": "HANDLE,HANDLE,STRING ret HANDLE"
    },
    {
        "name": "GetClientWidth",
        "args": " STRING  ret FLOAT"
    },
    {
        "name": "GetClientHeight",
        "args": " STRING  ret FLOAT"
    },
    {
        "name": "ChoseColorDialog",
        "args": " STRING,COLORREF       ret COLORREF"
    },
    {
        "name": "joygetx",
        "args": " FLOAT  ret FLOAT"
    },
    {
        "name": "joygety",
        "args": " FLOAT  ret FLOAT"
    },
    {
        "name": "joygetz",
        "args": " FLOAT  ret FLOAT"
    },
    {
        "name": "joygetbuttons",
        "args": " FLOAT  ret FLOAT"
    },
    {
        "name": "GetAsyncKeyState",
        "args": " FLOAT  ret FLOAT"
    },
    {
        "name": "GetClassDirectory",
        "args": " STRING  ret STRING"
    },
    {
        "name": "GetProjectDirectory",
        "args": ""
    },
    {
        "name": "GetWindowsDirectory",
        "args": ""
    },
    {
        "name": "GetSystemDirectory",
        "args": ""
    },
    {
        "name": "GetPathFromFile",
        "args": " STRING  ret STRING"
    },
    {
        "name": "AddSlash",
        "args": " STRING  ret STRING"
    },
    {
        "name": "GetStratumDirectory",
        "args": ""
    },
    {
        "name": "WinExecute",
        "args": " STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "SetScrollRange",
        "args": "STRING,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "GetActualWidth2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetActualHeight2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "SaveRectArea2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "LockSpace2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "LoadMenu",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "DeleteMenu",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "RegisterObject",
        "args": "STRING,HANDLE,STRING,FLOAT,FLOAT"
    },
    {
        "name": "UnregisterObject",
        "args": "STRING,STRING,FLOAT"
    },
    {
        "name": "MCISENDSTRINGstr",
        "args": " STRING ret STRING "
    },
    {
        "name": "MCISENDSTRING",
        "args": " STRING ret FLOAT "
    },
    {
        "name": "MCISENDSTRINGEX",
        "args": " STRING,FLOAT ret STRING "
    },
    {
        "name": "GETLASTMCIERROR",
        "args": ""
    },
    {
        "name": "GETMCIERRORSTR",
        "args": " FLOAT ret STRING"
    },
    {
        "name": "SetCalcOrder",
        "args": "STRING,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetCalcOrder",
        "args": "STRING,HANDLE ret FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "GetObject3dFromPoint2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,&HANDLE,&FLOAT ret HANDLE"
    },
    {
        "name": "SweepAndExtrude3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ,FLOAT,FLOAT,FLOAT,FLOAT,COLORREF,FLOAT ret HANDLE"
    },
    {
        "name": "IsObjectsIntersect2d",
        "args": "HANDLE,HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetLineArrows2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "CreateLine2d",
        "args": "HANDLE,HANDLE,HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "AddPoint2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "DelPoint2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetBrushObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetPenObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetRGNCreateMode",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetVectorNumPoints2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetVectorPoint2dx",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetVectorPoint2dy",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetBrushObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SetPenObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SetRGNCreateMode",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetVectorPoint2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "CreatePen2d",
        "args": "HANDLE,FLOAT,FLOAT,COLORREF,FLOAT ret HANDLE"
    },
    {
        "name": "GetPenColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    {
        "name": "GetPenRop2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetPenStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetPenWidth2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetPenColor2d",
        "args": "HANDLE,HANDLE,COLORREF ret FLOAT"
    },
    {
        "name": "SetPenROP2d",
        "args": "HANDLE,HANDLE,FLOAT    ret FLOAT"
    },
    {
        "name": "SetPenStyle2d",
        "args": "HANDLE,HANDLE,FLOAT    ret FLOAT"
    },
    {
        "name": "SetPenWidth2d",
        "args": "HANDLE,HANDLE,FLOAT    ret FLOAT"
    },
    {
        "name": "DeleteTool2d",
        "args": "HANDLE,FLOAT,HANDLE  ret FLOAT "
    },
    {
        "name": "DeleteObject2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetObjectOrg2dx",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetObjectOrg2dy",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetObjectParent2d",
        "args": "HANDLE,HANDLE  ret HANDLE"
    },
    {
        "name": "GetObjectAngle2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetObjectWidth2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetObjectHeight2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetObjectType2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "SetObjectOrg2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "SetObjectSize2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "CreateBrush2d",
        "args": "HANDLE,FLOAT,FLOAT,COLORREF,HANDLE,FLOAT ret HANDLE"
    },
    {
        "name": "SetPoints2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "CreateDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    {
        "name": "CreateDoubleDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    {
        "name": "CreateRDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    {
        "name": "CreateRDoubleDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    {
        "name": "CreateBitmap2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "CreateDoubleBitmap2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "GetSpaceOrg2dy",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "GetSpaceOrg2dx",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SetSpaceOrg2d",
        "args": "HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetScaleSpace2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetScaleSpace2d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SndPlaySound",
        "args": "STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "GetBottomObject2d",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "GetUpperObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetObjectFromZOrder2d",
        "args": "HANDLE,FLOAT ret HANDLE "
    },
    {
        "name": "GetLowerObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetTopObject2d",
        "args": "HANDLE ret HANDLE         "
    },
    {
        "name": "GetZOrder2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    {
        "name": "ObjectToBottom2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    {
        "name": "ObjectToTop2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    {
        "name": "SetZOrder2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT "
    },
    {
        "name": "SwapObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetBitmapSrcRect2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetObjectAttribute2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectAttribute2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "CreateFont2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "CreateString2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    {
        "name": "CreateText2d",
        "args": "HANDLE,HANDLE,HANDLE,COLORREF,COLORREF ret HANDLE"
    },
    {
        "name": "CreateRasterText2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "SetShowObject2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetString2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "AddGroupItem2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "CreateGroup2d",
        "args": "HANDLE,[HANDLE] ret HANDLE"
    },
    {
        "name": "DeleteGroup2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "DelGroupItem2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetGroupItem2d",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    null,
    {
        "name": "GetGroupItemsNum2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "IsGroupContainObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetGroupItem2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    {
        "name": "SetGroupItems2d",
        "args": "HANDLE,HANDLE,[HANDLE] ret FLOAT"
    },
    {
        "name": "CopyToClipboard2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "PasteFromClipboard2d",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "GetObjectName2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    {
        "name": "SetObjectName2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "GetObjectFromPoint2d",
        "args": "HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "GetLastPrimary2d",
        "args": ""
    },
    {
        "name": "RotateObject2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    {
        "name": "ShowObject2d",
        "args": "HANDLE,HANDLE"
    },
    {
        "name": "HideObject2d",
        "args": "HANDLE,HANDLE"
    },
    {
        "name": "StdHyperJump",
        "args": "HANDLE,FLOAT,FLOAT,HANDLE,FLOAT"
    },
    {
        "name": "GetObjectCount",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetHObjectByNum",
        "args": "STRING,FLOAT ret HANDLE"
    },
    null,
    {
        "name": "GetObjectClass",
        "args": "STRING,HANDLE ret STRING"
    },
    {
        "name": "FLOAT",
        "args": ""
    },
    {
        "name": "GetControlText2d",
        "args": "HANDLE,HANDLE ret STRING "
    },
    {
        "name": "SetControlText2d",
        "args": "HANDLE,HANDLE,STRING  ret FLOAT   "
    },
    {
        "name": "CheckDlgButton2d",
        "args": "HANDLE,HANDLE,FLOAT  ret FLOAT     "
    },
    {
        "name": "IsDlgButtonChecked2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "EnableControl2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetBrushHatch2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetString2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    {
        "name": "GetClassName",
        "args": "STRING ret STRING"
    },
    null,
    null,
    {
        "name": "GetBrushColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    {
        "name": "GetBrushRop2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetBrushDib2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetBrushStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetBrushHatch2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetBrushColor2d",
        "args": "HANDLE,HANDLE,COLORREF ret FLOAT"
    },
    {
        "name": "SetBrushRop2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetBrushDib2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetBrushStyle2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "CreateObject",
        "args": "STRING,STRING,STRING,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "DeleteObject",
        "args": "STRING,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "CreateClass",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "DeleteClass",
        "args": "STRING"
    },
    {
        "name": "OpenClassScheme",
        "args": "STRING,FLOAT ret HANDLE"
    },
    {
        "name": "CloseClassScheme",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "CreateLink",
        "args": "STRING,HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SetLinkVars",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "RemoveLink",
        "args": "STRING,HANDLE ret FLOAT"
    },
    {
        "name": "GetUniqueClassName",
        "args": "STRING ret STRING"
    },
    {
        "name": "GethObjectByName",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "CreateWindowEx",
        "args": "STRING,STRING,STRING,FLOAT,FLOAT,FLOAT,FLOAT,STRING ret HANDLE"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "GetVarF",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "GetVarS",
        "args": "STRING,STRING ret STRING"
    },
    {
        "name": "GetVarC",
        "args": "STRING,STRING ret COLORREF"
    },
    {
        "name": "SetVar",
        "args": "STRING,STRING,FLOAT"
    },
    {
        "name": "SetVar",
        "args": "STRING,STRING,STRING"
    },
    {
        "name": "SetVar",
        "args": "STRING,STRING,COLORREF"
    },
    {
        "name": "CreateLink",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    {
        "name": "SetModelText",
        "args": "STRING,HANDLE ret FLOAT"
    },
    {
        "name": "GetModelText",
        "args": "STRING,HANDLE ret FLOAT"
    },
    {
        "name": "GetAngleByXY",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectFromPoint2dEx",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "OpenVideo",
        "args": "STRING,FLOAT ret HANDLE"
    },
    {
        "name": "CloseVideo",
        "args": "HANDLE ret FLOAT"
    },
    null,
    null,
    null,
    {
        "name": "CreateVideoFrame2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "VideoSetPos2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "FrameSetPos2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "VideoPlay2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "VideoPause2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "VideoResume2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "VideoStop2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "FrameSetSrcRect2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "VideoGetPos2d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "FrameGetPos2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "FrameGetVideo2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "BeginWriteVideo2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT,FLOAT,FLOAT,STRING ret HANDLE"
    },
    {
        "name": "VideoDialog",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "WriteVideoFrame2d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SetControlStyle2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetControlStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "LBAddString",
        "args": "HANDLE,HANDLE,STRING  ret FLOAT"
    },
    {
        "name": "LBInsertString",
        "args": "HANDLE,HANDLE,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "LBGetString",
        "args": "HANDLE,HANDLE,FLOAT ret STRING"
    },
    {
        "name": "LBClearList",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "LBDeleteString",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "LBGetCount",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "LBGetSelIndex",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "LBSetSelIndex",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "LBGetCaretIndex",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "LBSetCaretIndex",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "LBFindString",
        "args": "HANDLE,HANDLE,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "LBFindStringExact",
        "args": "HANDLE,HANDLE,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "GetDibPixel2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret COLORREF"
    },
    {
        "name": "GetTime",
        "args": "&FLOAT,&FLOAT,&FLOAT,&FLOAT"
    },
    null,
    null,
    {
        "name": "VFunction",
        "args": ""
    },
    {
        "name": "DLLFunction",
        "args": ""
    },
    {
        "name": "GetElement",
        "args": "FLOAT,[FLOAT] ret FLOAT"
    },
    {
        "name": "SetElement",
        "args": "FLOAT,[FLOAT] ret FLOAT"
    },
    {
        "name": "EmptySpace2d",
        "args": "HANDLE ret FLOAT"
    },
    null,
    null,
    {
        "name": "CreatePolyLine2d",
        "args": "HANDLE,HANDLE,HANDLE,[FLOAT,FLOAT] ret HANDLE"
    },
    {
        "name": "GetNameByHandle",
        "args": "STRING,HANDLE ret STRING"
    },
    {
        "name": "SetSpaceLayers2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetSpaceLayers2d",
        "args": "HANDLE  ret FLOAT"
    },
    null,
    null,
    {
        "name": "LogMessage",
        "args": "STRING"
    },
    {
        "name": "SetVarsToDefault",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetTextObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetTextString2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "GetTextFont2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "LoadObjectState",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "SaveObjectState",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "GetWindowProp",
        "args": "STRING,STRING ret STRING"
    },
    {
        "name": "_CameraProc3d",
        "args": "STRING,HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbOpenBase",
        "args": "STRING,STRING,STRING,STRING ret HANDLE"
    },
    {
        "name": "DbOpenTable",
        "args": "HANDLE,STRING,STRING,STRING,STRING,FLOAT,STRING ret HANDLE"
    },
    {
        "name": "DbCloseBase",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbCloseTable",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbGetError",
        "args": ""
    },
    {
        "name": "DbGetErrorStr",
        "args": "FLOAT ret STRING"
    },
    {
        "name": "DbSetDir",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DbCloseAll",
        "args": ""
    },
    {
        "name": "DbGoTop",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbGoBottom",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbSkip",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbFieldId",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DbGetField",
        "args": "HANDLE,FLOAT ret STRING"
    },
    {
        "name": "DbSQL",
        "args": "HANDLE,STRING,FLOAT ret HANDLE"
    },
    {
        "name": "DbGetCount",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbBrowse",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DBGetFieldN",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DBGetFieldName",
        "args": "HANDLE,FLOAT ret STRING"
    },
    {
        "name": "DBGetFieldType",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbInsertRecord",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbAppendRecord",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbDeleteRecord",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbSetField",
        "args": "HANDLE,FLOAT,STRING ret FLOAT"
    },
    {
        "name": "DbSetField",
        "args": "HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "DbSetField",
        "args": "HANDLE,STRING,STRING ret FLOAT"
    },
    {
        "name": "DbSetField",
        "args": "HANDLE,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "DbGetFieldN",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DbGetField",
        "args": "HANDLE,STRING ret STRING"
    },
    {
        "name": "DbCreateTable",
        "args": "HANDLE,STRING,STRING,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "DbZap",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "DbAddIndex",
        "args": "HANDLE, STRING, FLOAT, STRING, FLOAT, FLOAT, STRING, STRING,[STRING] ret FLOAT"
    },
    {
        "name": "DbDeleteIndex",
        "args": "HANDLE, STRING, FLOAT, STRING ret FLOAT"
    },
    {
        "name": "DbOpenIndex",
        "args": "HANDLE, STRING, FLOAT ret FLOAT"
    },
    {
        "name": "DbSwitchToIndex",
        "args": "HANDLE, STRING, FLOAT, STRING, FLOAT ret FLOAT"
    },
    {
        "name": "DbCloseIndex",
        "args": "HANDLE, STRING ret FLOAT"
    },
    {
        "name": "DbRegenIndex",
        "args": "HANDLE, STRING, FLOAT, STRING ret FLOAT"
    },
    {
        "name": "DbGetBlob",
        "args": "HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    {
        "name": "DbPutBlob",
        "args": "HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    {
        "name": "DbFreeBlob",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbPackFile",
        "args": "HANDLE  ret FLOAT"
    },
    {
        "name": "DbSortTable",
        "args": "HANDLE,FLOAT,[STRING] ret FLOAT"
    },
    {
        "name": "DbGetDelMode",
        "args": "HANDLE         ret FLOAT"
    },
    {
        "name": "DbSetDelMode",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbSetCodePage",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbGetCodePage",
        "args": "HANDLE         ret FLOAT"
    },
    {
        "name": "DbLock",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbUnlock",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "DbUndeleteRecord",
        "args": "HANDLE         ret FLOAT"
    },
    {
        "name": "DbCopyTo",
        "args": "HANDLE,STRING,STRING ret FLOAT"
    },
    {
        "name": "DbSetToKey",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DbGetFieldCount",
        "args": "HANDLE ret FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "DbSetTable",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DbSetControlTable",
        "args": "HANDLE,HANDLE,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "DbGetPos",
        "args": "HANDLE ret FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "SendMessage",
        "args": "STRING,STRING,[STRING,STRING]"
    },
    {
        "name": "SetObjectName",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "SetText2d",
        "args": "HANDLE,HANDLE,HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    {
        "name": "GetTextFgColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    {
        "name": "GetTextBkColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    {
        "name": "Dialog",
        "args": "STRING,STRING,STRING ret FLOAT"
    },
    {
        "name": "DialogEx",
        "args": "STRING,[STRING,STRING,STRING] ret FLOAT"
    },
    {
        "name": "GetLink",
        "args": "STRING,HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "DialogBox",
        "args": "STRING,HANDLE ret FLOAT"
    },
    {
        "name": "GetRValue",
        "args": "COLORREF ret FLOAT"
    },
    {
        "name": "GetGValue",
        "args": "COLORREF ret FLOAT"
    },
    {
        "name": "GetBValue",
        "args": "COLORREF ret FLOAT"
    },
    {
        "name": "GetToolRef2d",
        "args": "HANDLE,FLOAT,HANDLE  ret FLOAT "
    },
    {
        "name": "GetNextTool2d",
        "args": "HANDLE,FLOAT,HANDLE  ret HANDLE"
    },
    {
        "name": "GetNextObject2d",
        "args": "HANDLE,HANDLE ret HANDLE  "
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "GetPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "SetPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT  "
    },
    {
        "name": "SetPrimitive3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,COLORREF,[FLOAT] ret FLOAT "
    },
    {
        "name": "CreateObject3d",
        "args": "HANDLE ret HANDLE  "
    },
    {
        "name": "DelPrimitive3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT   "
    },
    {
        "name": "GetNumPrimitives3d",
        "args": "HANDLE,HANDLE ret FLOAT   "
    },
    {
        "name": "AddPrimitive3d",
        "args": "HANDLE,HANDLE,FLOAT,COLORREF,[FLOAT] ret FLOAT "
    },
    {
        "name": "DelPoint3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetNumPoints3d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    {
        "name": "AddPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT  "
    },
    {
        "name": "SetObjectMatrix3d",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectMatrix3d",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "TransformObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "RotateObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectBase3dM",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "SetObjectBase3d",
        "args": "HANDLE,HANDLE, FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectBase3d",
        "args": "HANDLE,HANDLE,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "GetSpace3d",
        "args": ""
    },
    {
        "name": "GetObjectDimension3d",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "TransformObject3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "RotateObject3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetObjectColor3d",
        "args": "HANDLE,HANDLE,COLORREF ret FLOAT"
    },
    {
        "name": "CreateDefCamera3d",
        "args": "HANDLE,FLOAT ret HANDLE"
    },
    {
        "name": "SwitchToCamera3d",
        "args": ""
    },
    {
        "name": "GetActiveCamera",
        "args": ""
    },
    {
        "name": "CreateSpace3d",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "DeleteSpace3d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Create3dView",
        "args": ""
    },
    {
        "name": "GetObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectColor3d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    {
        "name": "SetCurrentObject2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetCurrentObject2d",
        "args": "HANDLE ret HANDLE        "
    },
    {
        "name": "CreateSurface3d",
        "args": "HANDLE,FLOAT,FLOAT,COLORREF ret HANDLE"
    },
    {
        "name": "FitToCamera3d",
        "args": "HANDLE,HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetCameraPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "PushCrdSystem3d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "PopCrdSystem3d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SelectLocalCrd3d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SelectWorldCrd3d",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SelectViewCrd3d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "TransformCamera3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetColors3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT "
    },
    {
        "name": "GetColors3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT "
    },
    {
        "name": "GetMaterialByName3d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "new",
        "args": ""
    },
    {
        "name": "delete",
        "args": "HANDLE"
    },
    {
        "name": "vClearAll",
        "args": ""
    },
    {
        "name": "vInsert",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "vDelete",
        "args": "HANDLE,FLOAT ret FLOAT "
    },
    {
        "name": "vGetCount",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "vGetType",
        "args": "HANDLE,FLOAT ret STRING"
    },
    {
        "name": "vGetF",
        "args": "HANDLE,FLOAT,STRING ret FLOAT    "
    },
    {
        "name": "vGetS",
        "args": "HANDLE,FLOAT,STRING ret STRING   "
    },
    {
        "name": "vGetH",
        "args": "HANDLE,FLOAT,STRING ret HANDLE   "
    },
    {
        "name": "vSet",
        "args": "HANDLE,FLOAT,STRING,FLOAT"
    },
    {
        "name": "vSet",
        "args": "HANDLE,FLOAT,STRING,STRING"
    },
    {
        "name": "vSet",
        "args": "HANDLE,FLOAT,STRING,HANDLE"
    },
    {
        "name": "GetControlText2ds",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT "
    },
    {
        "name": "SetControlText2ds",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT   "
    },
    null,
    null,
    null,
    null,
    null,
    {
        "name": "LoadProject",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "UnloadProject",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "SetActiveProject",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "IsProjectExist",
        "args": "STRING ret FLOAT"
    },
    null,
    {
        "name": "SetProjectProp",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    {
        "name": "GetProjectProp",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "SetProjectProp",
        "args": "STRING,STRING,STRING ret FLOAT"
    },
    {
        "name": "ApplyTexture3d",
        "args": "HANDLE,HANDLE,HANDLE,HANDLE,[FLOAT] ret FLOAT"
    },
    {
        "name": "RemoveTexture3d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "CreateDir",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "DeleteDir",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "FileRename",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "FileCopy",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "FileExist",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "FileDelete",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetFileList",
        "args": "STRING,FLOAT ret HANDLE"
    },
    {
        "name": "GetActualSize2d",
        "args": "HANDLE,HANDLE,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "SetBkBrush2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetBkBrush2d",
        "args": "HANDLE         ret HANDLE"
    },
    {
        "name": "diff1",
        "args": "FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "equation",
        "args": "FLOAT"
    },
    {
        "name": "diff2",
        "args": "FLOAT,FLOAT,&FLOAT,&FLOAT,&FLOAT,&FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "dequation",
        "args": "FLOAT"
    },
    {
        "name": "GetDibObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SetDibObject2d",
        "args": "HANDLE,HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetDDibObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SetDDibObject2d",
        "args": "HANDLE,HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "GetDate",
        "args": "&FLOAT,&FLOAT,&FLOAT"
    },
    {
        "name": "GetVideoMarker",
        "args": "HANDLE,COLORREF,COLORREF,COLORREF,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "GetVarInfo",
        "args": "STRING,FLOAT,&STRING,&STRING,&STRING,&STRING ret FLOAT"
    },
    {
        "name": "GetVarCount",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "vSave",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "vLoad",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "GetBitmapSrcRect2d",
        "args": "HANDLE,HANDLE,&FLOAT,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    {
        "name": "SetHyperJump2d",
        "args": "HANDLE,HANDLE,FLOAT,[STRING] ret FLOAT"
    },
    {
        "name": "SetRDib2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "SetRDoubleDib2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "GetRDib2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    {
        "name": "GetRDoubleDib2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    {
        "name": "MSort",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "DuplicateObject3d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "CheckMenuItem",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "EnableMenuItem",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "+",
        "args": "STRING,FLOAT ret STRING"
    },
    {
        "name": "+",
        "args": "FLOAT,STRING ret STRING"
    },
    {
        "name": "GetScreenWidth",
        "args": ""
    },
    {
        "name": "GetScreenHeight",
        "args": ""
    },
    {
        "name": "GetWorkAreaX",
        "args": ""
    },
    {
        "name": "GetWorkAreaY",
        "args": ""
    },
    {
        "name": "GetWorkAreaWidth",
        "args": ""
    },
    {
        "name": "GetWorkAreaHeight",
        "args": ""
    },
    {
        "name": "GetKeyboardLayout",
        "args": ""
    },
    {
        "name": "Substr",
        "args": "STRING,FLOAT ret STRING"
    },
    null,
    null,
    {
        "name": "SetWindowTransparent",
        "args": "STRING, FLOAT ret FLOAT"
    },
    {
        "name": "SetWindowTransparentColor",
        "args": "STRING, COLORREF ret FLOAT"
    },
    {
        "name": "SetWindowRegion",
        "args": "STRING, HANDLE ret FLOAT"
    },
    {
        "name": "GetTitleHeight",
        "args": ""
    },
    {
        "name": "GetSmallTitleHeight",
        "args": ""
    },
    {
        "name": "GetFixedFrameWidth",
        "args": ""
    },
    {
        "name": "GetFixedFrameHeight",
        "args": ""
    },
    {
        "name": "GetSizeFrameWidth",
        "args": ""
    },
    {
        "name": "GetSizeFrameHeight",
        "args": ""
    },
    {
        "name": "WindowInTaskBar",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    null,
    {
        "name": "SetWindowTransparent",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "SetWindowTransparentColor",
        "args": "HANDLE, COLORREF ret FLOAT"
    },
    {
        "name": "SetWindowRegion",
        "args": "HANDLE, HANDLE ret FLOAT"
    },
    {
        "name": "ShowCursor",
        "args": "FLOAT"
    },
    {
        "name": "ScreenShot",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "LockObject2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetVarInfo",
        "args": "STRING,FLOAT,&STRING,&STRING,&STRING,&STRING,&FLOAT ret FLOAT"
    },
    {
        "name": "++",
        "args": "FLOAT"
    },
    null,
    {
        "name": "AudioOpenSound",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "AudioPlay",
        "args": "HANDLE"
    },
    {
        "name": "AudioStop",
        "args": "HANDLE"
    },
    {
        "name": "AudioIsPlaying",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioReset",
        "args": "HANDLE"
    },
    {
        "name": "AudioSetRepeat",
        "args": "HANDLE,FLOAT"
    },
    {
        "name": "AudioGetRepeat",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioSetVolume",
        "args": "HANDLE,FLOAT"
    },
    {
        "name": "AudioGetVolume",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioSetBalance",
        "args": "HANDLE,FLOAT"
    },
    {
        "name": "AudioGetBalance",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioSetTone",
        "args": "HANDLE,FLOAT"
    },
    {
        "name": "AudioGetTone",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioIsSeekable",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioSetPosition",
        "args": "HANDLE,FLOAT"
    },
    {
        "name": "AudioGetPosition",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AudioGetLength",
        "args": "HANDLE ret FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "GetWordInfo",
        "args": "STRING ret STRING"
    },
    {
        "name": "GetAnswer",
        "args": "STRING,STRING ret STRING"
    },
    {
        "name": "GetSentanceTree",
        "args": "STRING ret STRING"
    },
    {
        "name": "GetWordProperty",
        "args": "STRING,STRING,STRING ret STRING"
    },
    {
        "name": "GetWordPropertyInSent",
        "args": "STRING,STRING,FLOAT,STRING ret STRING"
    },
    {
        "name": "GetWordInSentByRole",
        "args": "STRING,STRING ret STRING"
    },
    {
        "name": "GetWordFormCount",
        "args": "STRING ret FLOAT"
    },
    {
        "name": "GetWordForm",
        "args": "STRING,FLOAT,STRING ret STRING"
    },
    {
        "name": "SearchWords",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "GetWordInfo",
        "args": "STRING, HANDLE"
    },
    {
        "name": "SendSMS",
        "args": "STRING,STRING"
    },
    {
        "name": "ScreenShot",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SendMail",
        "args": "STRING"
    },
    {
        "name": "ScreenShot",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "ScreenShot",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "GetFontName2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    {
        "name": "GetFontSize2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetTextCount2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetFontStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetFontSize2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetFontStyle2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SetFontName2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    {
        "name": "GetTextString2d",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    {
        "name": "GetTextFont2d",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    {
        "name": "GetTextFgColor2d",
        "args": "HANDLE,HANDLE,FLOAT ret COLORREF"
    },
    {
        "name": "GetTextBkColor2d",
        "args": "HANDLE,HANDLE,FLOAT ret COLORREF"
    },
    {
        "name": "SetTextString2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    {
        "name": "SetTextFont2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    {
        "name": "SetTextFgColor2d",
        "args": "HANDLE,HANDLE,FLOAT,COLORREF ret FLOAT"
    },
    {
        "name": "SetTextBkColor2d",
        "args": "HANDLE,HANDLE,FLOAT,COLORREF ret FLOAT"
    },
    {
        "name": "SetText2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    {
        "name": "CreateFont2dpt",
        "args": "HANDLE,STRING,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "SetStandartCursor",
        "args": "HANDLE,FLOAT"
    },
    {
        "name": "SetStandartCursor",
        "args": "STRING,FLOAT"
    },
    {
        "name": "LoadCursor",
        "args": "HANDLE,STRING"
    },
    {
        "name": "LoadCursor",
        "args": "STRING,STRING"
    },
    {
        "name": "inc",
        "args": "&FLOAT"
    },
    {
        "name": "inc",
        "args": "&FLOAT,FLOAT"
    },
    {
        "name": "dec",
        "args": "&FLOAT"
    },
    {
        "name": "dec",
        "args": "&FLOAT,FLOAT"
    },
    {
        "name": "limit",
        "args": "FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "GetFontList",
        "args": ""
    },
    {
        "name": "vSort",
        "args": "HANDLE,FLOAT,[STRING] ret FLOAT"
    },
    {
        "name": "vSort",
        "args": "HANDLE,[STRING] ret FLOAT"
    },
    {
        "name": "vSort",
        "args": "HANDLE,[STRING,FLOAT]  ret FLOAT"
    },
    {
        "name": "GetUserKeyValue",
        "args": "STRING ret STRING"
    },
    {
        "name": "GetUserKeyFullValue",
        "args": "STRING ret STRING"
    },
    {
        "name": "GetTempDirectory",
        "args": ""
    },
    {
        "name": "SendUserResult",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "CopyUserResult",
        "args": ""
    },
    {
        "name": "GetROMDriveNames",
        "args": ""
    },
    {
        "name": "ShellWait",
        "args": "STRING,STRING,STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "ReadUserKey",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "GetUserKeyValue",
        "args": "HANDLE,STRING ret STRING"
    },
    {
        "name": "GetUserKeyFullValue",
        "args": "HANDLE,STRING ret STRING"
    },
    {
        "name": "SendUserResult",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "CopyUserResult",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "ReadProjectKey",
        "args": "HANDLE,STRING ret FLOAT"
    },
    {
        "name": "UserKeyIsAutorized",
        "args": ""
    },
    {
        "name": "UserKeyIsAutorized",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SearchWords",
        "args": "STRING,FLOAT ret HANDLE"
    },
    {
        "name": "SearchWords",
        "args": "STRING,FLOAT,FLOAT ret HANDLE"
    },
    {
        "name": "FindNextWord",
        "args": "STRING ret STRING"
    },
    {
        "name": "FindPrevWord",
        "args": "STRING ret STRING"
    },
    {
        "name": "AnalyseWord",
        "args": "STRING ret STRING"
    },
    {
        "name": "InitAnalyzer",
        "args": "STRING,STRING,STRING ret FLOAT"
    },
    {
        "name": "MorphDivide",
        "args": "STRING ret STRING"
    },
    {
        "name": "SetMorphDivide",
        "args": "STRING,STRING ret FLOAT"
    },
    {
        "name": "WordDivide",
        "args": "STRING,STRING ret STRING"
    },
    {
        "name": "AnimationState_GetTimePosition",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AnimationState_SetTimePosition",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "AnimationState_GetLength",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AnimationState_SetLength",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "AnimationState_GetWeight",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AnimationState_SetWeight",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "AnimationState_AddTime",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "AnimationState_GetEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "AnimationState_SetEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "AnimationState_SetLoop",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "AnimationState_GetLoop",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Bone_SetManuallyControlled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Bone_GetManuallyControlled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Bone_Reset",
        "args": "HANDLE"
    },
    {
        "name": "Camera_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Camera_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "Camera_SetFOV",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Camera_GetFOV",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Camera_SetAspectRatio",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Camera_GetAspectRatio",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Camera_SetNearClipDistance",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Camera_GetNearClipDistance",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Camera_SetFarClipDistance",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Camera_GetFarClipDistance",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Camera_SetProjectionType",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Camera_GetProjectionType",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Camera_SetPolygonMode",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Camera_GetPolygonMode",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Camera_SetFrustumOffset",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "Camera_SetFocalLength",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Collision_RayCast",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Collision_Sort",
        "args": ""
    },
    {
        "name": "Collision_GetResultCount",
        "args": ""
    },
    {
        "name": "Collision_GetDistance",
        "args": "FLOAT ret FLOAT"
    },
    {
        "name": "Collision_GetObject",
        "args": "FLOAT ret HANDLE"
    },
    {
        "name": "Entity_Create",
        "args": "HANDLE, STRING, STRING ret HANDLE"
    },
    {
        "name": "Entity_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "Entity_SetMaterial",
        "args": "HANDLE, FLOAT, STRING"
    },
    {
        "name": "Entity_GetAnimationState",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Entity_GetBone",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Light_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Light_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "Light_SetAttenuation",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Light_SetSpotlightRange",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Light_SetDiffuseColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Light_SetSpecularColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Light_SetType",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Light_SetPowerScale",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Light_GetPowerScale",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "ManualObject_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "ManualObject_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "ManualObject_Clear",
        "args": "HANDLE"
    },
    {
        "name": "ManualObject_EstimateVertexCount",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "ManualObject_EstimateIndexCount",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "ManualObject_SetDynamic",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "ManualObject_GetDynamic",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "ManualObject_Begin",
        "args": "HANDLE, STRING, FLOAT"
    },
    {
        "name": "ManualObject_End",
        "args": "HANDLE"
    },
    {
        "name": "ManualObject_Position",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "ManualObject_Normal",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "ManualObject_Colour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "ManualObject_TextureCoord",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "ManualObject_Index",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "ManualObject_ConvertToMesh",
        "args": "HANDLE, STRING"
    },
    {
        "name": "Material_Create",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "Material_Get",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "Material_GetBestTechnique",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "Material_GetTechniqueByName",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Material_GetTechniqueByIndex",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "Movable_SetParent",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Movable_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "Movable_SetCastShadows",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Movable_GetCastShadows",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Movable_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Movable_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Node_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationEulerXYZ",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationEulerXZY",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationEulerYXZ",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationEulerYZX",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationEulerZXY",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationEulerZYX",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationAxis",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetRotationQuaternion",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetScale",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Node_SetParent",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Node_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "Node_AddChild",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Node_RemoveChild",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Overlay_Get",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "Overlay_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Overlay_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "OverlayElement_Get",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "OverlayElement_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "OverlayElement_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "OverlayElement_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "OverlayElement_SetSize",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "OverlayElement_SetColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "OverlayElement_SetCaption",
        "args": "HANDLE, STRING"
    },
    {
        "name": "OverlayElement_SetMaterialName",
        "args": "HANDLE, STRING"
    },
    {
        "name": "ParticleSystem_Create",
        "args": "HANDLE, STRING, STRING ret HANDLE"
    },
    {
        "name": "ParticleSystem_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "Pass_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Pass_SetAmbient",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Pass_SetDiffuse",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Pass_SetSpecular",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Pass_SetShininess",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetSelfIllumination",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Pass_SetSceneBlending",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "Pass_SetDepthCheckEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetDepthWriteEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetDepthFunction",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetColourWriteEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetCullingMode",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetLightingEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetShadingMode",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetPolygonMode",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Pass_SetAlphaRejectSettings",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "Pass_GetTextureUnitStateByName",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Pass_GetTextureUnitStateByIndex",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "RenderTexture_Create",
        "args": "STRING, FLOAT, FLOAT ret HANDLE"
    },
    {
        "name": "RenderTexture_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "RenderWindow_Create",
        "args": "HANDLE, FLOAT, FLOAT ret HANDLE"
    },
    {
        "name": "RenderWindow_GetPrimary",
        "args": ""
    },
    {
        "name": "RenderWindow_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "RenderWindow_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "RenderWindow_SetSize",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "Root_Create",
        "args": "STRING, STRING, STRING"
    },
    {
        "name": "Root_Destroy",
        "args": ""
    },
    {
        "name": "Root_Initialise",
        "args": ""
    },
    {
        "name": "Root_IsInitialised",
        "args": ""
    },
    {
        "name": "Root_RestoreConfig",
        "args": ""
    },
    {
        "name": "Root_SaveConfig",
        "args": ""
    },
    {
        "name": "Root_ShowConfigDialog",
        "args": ""
    },
    {
        "name": "Root_RenderOneFrame",
        "args": ""
    },
    {
        "name": "Root_AddResourceLocationFromConfigFile",
        "args": "STRING"
    },
    {
        "name": "Root_AddResourceLocation",
        "args": "STRING, STRING, STRING, FLOAT"
    },
    {
        "name": "Root_InitialiseAllResourceGroups",
        "args": ""
    },
    {
        "name": "Root_GetTime",
        "args": ""
    },
    {
        "name": "Scene_Create",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "Scene_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "Scene_SetWorldGeometry",
        "args": "HANDLE, STRING"
    },
    {
        "name": "Scene_GetRootSceneNode",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "Scene_SetShadowTechnique",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Scene_GetShadowTechnique",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Scene_SetFog",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Scene_SetAmbientLight",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Scene_SetSkyBox",
        "args": "HANDLE, FLOAT, STRING, FLOAT"
    },
    {
        "name": "Scene_GetCamera",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Scene_GetEntity",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Scene_GetLight",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Scene_GetParticleSystem",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Scene_GetSceneNode",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Scene_Clear",
        "args": "HANDLE"
    },
    {
        "name": "Scene_Load",
        "args": "HANDLE, STRING"
    },
    {
        "name": "SceneNode_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "SceneNode_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "SceneNode_SetAutoTracking",
        "args": "HANDLE, HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "SceneNode_AttachObject",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "SceneNode_DetachObject",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Technique_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Technique_GetPassByName",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "Technique_GetPassByIndex",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "TextureUnitState_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    {
        "name": "TextureUnitState_SetTexture",
        "args": "HANDLE, STRING, FLOAT"
    },
    {
        "name": "TextureUnitState_GetTexture",
        "args": "HANDLE, STRING, HANDLE"
    },
    {
        "name": "Viewport_Create",
        "args": "HANDLE, HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "Viewport_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "Viewport_SetCamera",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Viewport_GetCamera",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "Viewport_SetBackgroundColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Viewport_SetDimensions",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Viewport_SetOverlaysEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Viewport_GetOverlaysEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Viewport_GetRay",
        "args": "HANDLE, FLOAT, FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "RenderWindow_CreateEx",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT ret HANDLE"
    },
    {
        "name": "RenderWindow_ToggleFullscreen",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "BillboardSet_Create",
        "args": "HANDLE, STRING, FLOAT ret HANDLE"
    },
    {
        "name": "BillboardSet_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "BillboardSet_CreateBillboard",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT ret HANDLE"
    },
    {
        "name": "BillboardSet_GetNumBillboards",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "BillboardSet_GetBillboard",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "BillboardSet_RemoveBillboard",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "BillboardSet_SetBillboardType",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "BillboardSet_GetBillboardType",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "BillboardSet_SetCommonDirection",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "BillboardSet_GetCommonDirection",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "BillboardSet_SetCommonUpVector",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "BillboardSet_GetCommonUpVector",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "BillboardSet_SetDefaultDimensions",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "BillboardSet_GetDefaultDimensions",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "BillboardSet_SetMaterialName",
        "args": "HANDLE, STRING"
    },
    {
        "name": "BillboardSet_GetMaterialName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "Billboard_SetRotation",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Billboard_GetRotation",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Billboard_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Billboard_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Billboard_SetColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "Billboard_GetColour",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    null,
    null,
    {
        "name": "SetControlFont2d",
        "args": "HANDLE,HANDLE,HANDLE  ret FLOAT   "
    },
    {
        "name": "SetControlTextColor2d",
        "args": "HANDLE,HANDLE,COLORREF  ret FLOAT   "
    },
    {
        "name": "GetControlTextLength2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    {
        "name": "GetControlText2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret STRING "
    },
    {
        "name": "AddControlText2d",
        "args": "HANDLE,HANDLE,STRING  ret FLOAT   "
    },
    {
        "name": "AddControlText2d",
        "args": "HANDLE,HANDLE,STRING,FLOAT  ret FLOAT   "
    },
    {
        "name": "SetWindowOwner",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetWindowParent",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "GetProjectClasses",
        "args": "FLOAT ret HANDLE"
    },
    {
        "name": "GetClassFile",
        "args": "STRING ret STRING"
    },
    {
        "name": "AddText2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    {
        "name": "RemoveText2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "AddText2d",
        "args": "HANDLE,HANDLE, HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    {
        "name": "LBGetSelIndexs",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    {
        "name": "SetStringBufferMode",
        "args": "FLOAT"
    },
    {
        "name": "SetModelText",
        "args": "STRING,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "SendSMS",
        "args": "STRING,STRING,FLOAT  ret FLOAT"
    },
    {
        "name": "SendMail",
        "args": "STRING ,FLOAT  ret FLOAT"
    },
    {
        "name": "SetControlFocus2d",
        "args": "HANDLE,HANDLE"
    },
    {
        "name": "DbSQL",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    {
        "name": "SetObjectAlpha2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    {
        "name": "GetObjectAlpha2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    {
        "name": "SetBrushPoints2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetBrushColors2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SetDibPixel2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,COLORREF ret FLOAT"
    },
    {
        "name": "EncryptStream",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "SendData",
        "args": "STRING ,FLOAT  ret FLOAT"
    },
    {
        "name": "DecryptStream",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    {
        "name": "roundt",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "SetSpaceRenderEngine2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "Viewport_AddCompositor",
        "args": "HANDLE, STRING, FLOAT ret HANDLE"
    },
    {
        "name": "Viewport_RemoveCompositor",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Viewport_GetNumCompositors",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Viewport_GetCompositor",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "Compositor_SetEnabled",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Compositor_GetEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Node_GetName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "Node_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Node_GetScale",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Node_GetRotationQuaternion",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Node_GetNumChildren",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Node_GetChild",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "Movable_GetName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "Movable_GetBoundingBox",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "SceneNode_GetNumObjects",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "SceneNode_GetObject",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "SceneNode_SetVisible",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "SceneNode_GetScene",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "ParticleSystem_CreateEx",
        "args": "HANDLE, STRING, STRING ret HANDLE"
    },
    {
        "name": "Material_GetName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "MovableText_Create",
        "args": "STRING, STRING, STRING ret HANDLE"
    },
    {
        "name": "MovableText_Destroy",
        "args": "HANDLE"
    },
    {
        "name": "MovableText_SetFontName",
        "args": "HANDLE, STRING"
    },
    {
        "name": "MovableText_GetFontName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "MovableText_SetCaption",
        "args": "HANDLE, STRING"
    },
    {
        "name": "MovableText_GetCaption",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "MovableText_SetColor",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "MovableText_GetColor",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "MovableText_SetCharacterHeight",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "MovableText_GetCharacterHeight",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "MovableText_SetSpaceWidth",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "MovableText_GetSpaceWidth",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "MovableText_SetTextAlignment",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "MovableText_GetTextAlignment",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "MovableText_SetGlobalTranslation",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "MovableText_GetGlobalTranslation",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "MovableText_SetLocalTranslation",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    {
        "name": "MovableText_GetLocalTranslation",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Overlay_Create",
        "args": "STRING ret HANDLE"
    },
    {
        "name": "Overlay_GetName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "Overlay_FindElementAt",
        "args": "HANDLE, FLOAT, FLOAT ret HANDLE"
    },
    {
        "name": "Overlay_SetZOrder",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Overlay_GetZOrder",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Overlay_SetScale",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "Overlay_GetScale",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "Overlay_SetScroll",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "Overlay_GetScroll",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "Overlay_SetRotate",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "Overlay_GetRotate",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Overlay_AddChild",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "Overlay_RemoveChild",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "OverlayContainer_AddChild",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "OverlayContainer_RemoveChild",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "OverlayContainer_GetChild",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "OverlayContainer_GetChildCount",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "OverlayElement_Create",
        "args": "STRING, STRING ret HANDLE"
    },
    {
        "name": "OverlayElement_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "OverlayElement_GetSize",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "OverlayElement_GetColour",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "OverlayElement_GetCaption",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "OverlayElement_GetMaterialName",
        "args": "HANDLE, &STRING"
    },
    {
        "name": "OverlayElement_SetMetricsMode",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "OverlayElement_GetMetricsMode",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "OverlayElement_SetAlignment",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    {
        "name": "OverlayElement_GetAlignment",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "OverlayElement_IsContainer",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "OverlayElement_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "Entity_GetMaterial",
        "args": "HANDLE, FLOAT, &STRING"
    },
    {
        "name": "Entity_GetSubEntityCount",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetAmbient",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Pass_GetDiffuse",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Pass_GetSpecular",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Pass_GetShininess",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetSelfIllumination",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Pass_GetSceneBlending",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "Pass_GetDepthCheckEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetDepthWriteEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetDepthFunction",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetColourWriteEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetCullingMode",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetLightingEnabled",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetShadingMode",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetPolygonMode",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "Pass_GetAlphaRejectSettings",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "Node_GetDerivedPosition",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Node_GetDerivedScale",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Node_GetDerivedRotationQuaternion",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "StringInterface_SetParameter",
        "args": "HANDLE, STRING, STRING"
    },
    {
        "name": "StringInterface_GetParameter",
        "args": "HANDLE, STRING, STRING"
    },
    {
        "name": "StringInterface_GetParameterCount",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "StringInterface_GetParameterType",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "StringInterface_GetParameterName",
        "args": "HANDLE, FLOAT, STRING"
    },
    {
        "name": "StringInterface_GetParameterDescription",
        "args": "HANDLE, FLOAT, STRING"
    },
    {
        "name": "Entity_GetVertexCount",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "Entity_GetIndexCount",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "RenderWindow_GetCursorPosition",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "RenderWindow_GetCursorHovered",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "RenderWindow_GetMouseButtonPressed",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "RenderWindow_GetKeyboardButtonPressed",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    {
        "name": "RenderWindow_GetViewportCount",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "RenderWindow_GetViewport",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    {
        "name": "RenderWindow_GetCount",
        "args": ""
    },
    {
        "name": "RenderWindow_Get",
        "args": "FLOAT ret HANDLE"
    },
    {
        "name": "RenderWindow_GetWheelPosition",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "RenderWindow_Create2",
        "args": "HANDLE, STRING, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT ret HANDLE"
    },
    {
        "name": "ParticleSystem_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    {
        "name": "ParticleSystem_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    {
        "name": "ParticleSystem_SetParent",
        "args": "HANDLE, HANDLE"
    },
    {
        "name": "ParticleSystem_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    {
        "name": "ParticleSystem_GetName",
        "args": "HANDLE, STRING"
    },
    {
        "name": "Viewport_GetBackgroundColour",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "Viewport_GetDimensions",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    {
        "name": "RenderWindow_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    {
        "name": "RenderWindow_GetSize",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    {
        "name": "NUI_Init",
        "args": ""
    },
    {
        "name": "NUI_GetDeviceCount",
        "args": ""
    },
    {
        "name": "NUI_CreateInstance",
        "args": "FLOAT ret HANDLE"
    },
    {
        "name": "NUI_DestroyInstance",
        "args": "HANDLE"
    },
    {
        "name": "NUI_GetDeviceName",
        "args": "HANDLE ret STRING"
    },
    {
        "name": "NUI_InitInstance",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    {
        "name": "NUI_GetSkeletonPositions",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    }
]
export default arr;