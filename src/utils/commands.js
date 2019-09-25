export const realCommandNames = {
    "1": {
        "name": "push",
        "args": ""
    },
    "2": {
        "name": "push_new",
        "args": ""
    },
    "3": {
        "name": "push",
        "args": ""
    },
    "4": {
        "name": "push_new",
        "args": ""
    },
    "5": {
        "name": "push_cst",
        "args": ""
    },
    "6": {
        "name": "push_cst",
        "args": ""
    },
    "10": {
        "name": ":=_old",
        "args": "FLOAT,FLOAT"
    },
    "11": {
        "name": ":=",
        "args": "FLOAT,FLOAT"
    },
    "12": {
        "name": ":=_old",
        "args": "INTEGER,INTEGER"
    },
    "13": {
        "name": ":=",
        "args": "INTEGER,INTEGER"
    },
    "16": {
        "name": "RGBf",
        "args": "FLOAT ret COLORREF"
    },
    "17": {
        "name": "FLOAT",
        "args": "COLORREF ret FLOAT"
    },
    "18": {
        "name": "+",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "19": {
        "name": "-",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "20": {
        "name": "/",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "21": {
        "name": "*",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "22": {
        "name": "%",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "23": {
        "name": "tan",
        "args": "FLOAT ret FLOAT"
    },
    "24": {
        "name": "arctan",
        "args": "FLOAT ret FLOAT"
    },
    "25": {
        "name": "sin",
        "args": "FLOAT ret FLOAT"
    },
    "26": {
        "name": "arcsin",
        "args": "FLOAT ret FLOAT"
    },
    "27": {
        "name": "cos",
        "args": "FLOAT ret FLOAT"
    },
    "28": {
        "name": "arccos",
        "args": "FLOAT ret FLOAT"
    },
    "29": {
        "name": "ln",
        "args": "FLOAT ret FLOAT"
    },
    "30": {
        "name": "lg",
        "args": "FLOAT ret FLOAT"
    },
    "31": {
        "name": "log",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "32": {
        "name": "^",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "33": {
        "name": "exp",
        "args": "FLOAT ret FLOAT"
    },
    "34": {
        "name": "sqrt",
        "args": "FLOAT ret FLOAT"
    },
    "35": {
        "name": "sqr",
        "args": "FLOAT ret FLOAT"
    },
    "36": {
        "name": "ed",
        "args": "FLOAT ret FLOAT"
    },
    "37": {
        "name": "delta",
        "args": "FLOAT ret FLOAT"
    },
    "38": {
        "name": "max",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "39": {
        "name": "min",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "40": {
        "name": "average",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "41": {
        "name": "round",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "42": {
        "name": "rnd",
        "args": "FLOAT ret FLOAT"
    },
    "43": {
        "name": "and",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "44": {
        "name": "or",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "45": {
        "name": "not",
        "args": "FLOAT ret FLOAT"
    },
    "46": {
        "name": "abs",
        "args": "FLOAT ret FLOAT"
    },
    "47": {
        "name": "sgn",
        "args": "FLOAT ret FLOAT"
    },
    "48": {
        "name": "rad",
        "args": "FLOAT ret FLOAT"
    },
    "49": {
        "name": "deg",
        "args": "FLOAT ret FLOAT"
    },
    "50": {
        "name": "Stop",
        "args": "FLOAT"
    },
    "51": {
        "name": "jmp",
        "args": ""
    },
    "52": {
        "name": "jnz",
        "args": "FLOAT"
    },
    "53": {
        "name": "jz",
        "args": "FLOAT"
    },
    "54": {
        "name": "==",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "55": {
        "name": "!=",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "56": {
        "name": ">",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "57": {
        "name": ">=",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "58": {
        "name": "<",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "59": {
        "name": "<=",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "60": {
        "name": "MCreate",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "61": {
        "name": "MDelete",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "62": {
        "name": "MFill",
        "args": "FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "63": {
        "name": "MGet",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "64": {
        "name": "MPut",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "65": {
        "name": "MEditor",
        "args": "FLOAT,FLOAT"
    },
    "66": {
        "name": "MDiag",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "67": {
        "name": "MAddX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "68": {
        "name": "MSubX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "69": {
        "name": "MDivX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "70": {
        "name": "MMulX",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "71": {
        "name": "MDet",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    "72": {
        "name": "MDelta",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    "73": {
        "name": "MEd",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    "74": {
        "name": "MTransp",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "75": {
        "name": "MAddC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "76": {
        "name": "MNot",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    "77": {
        "name": "MSum",
        "args": "FLOAT,FLOAT  ret FLOAT"
    },
    "78": {
        "name": "MSubC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "79": {
        "name": "MMulC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "80": {
        "name": "trunc",
        "args": "FLOAT ret FLOAT"
    },
    "81": {
        "name": "CloseAll",
        "args": ""
    },
    "82": {
        "name": "==",
        "args": "INTEGER,INTEGER ret FLOAT"
    },
    "83": {
        "name": "!=",
        "args": "COLORREF,COLORREF ret FLOAT"
    },
    "84": {
        "name": "ed",
        "args": "HANDLE ret FLOAT"
    },
    "85": {
        "name": "&&",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "86": {
        "name": "||",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "87": {
        "name": "not",
        "args": "HANDLE ret FLOAT"
    },
    "88": {
        "name": "NotBin",
        "args": "FLOAT ret FLOAT"
    },
    "89": {
        "name": "SetCrdSystem2d",
        "args": "HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "90": {
        "name": "MDivC",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "91": {
        "name": "MMul",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "92": {
        "name": "MGlue",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "93": {
        "name": "MCut",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "94": {
        "name": "MMove",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "95": {
        "name": "MObr",
        "args": "FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "96": {
        "name": "MDim",
        "args": "FLOAT,&FLOAT,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    "97": {
        "name": "Xor",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "98": {
        "name": "XorBin",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "99": {
        "name": "ChooseFolderDialog",
        "args": "STRING,STRING,FLOAT ret STRING  "
    },
    "100": {
        "name": "MSaveAs",
        "args": "FLOAT,STRING,FLOAT  ret FLOAT"
    },
    "101": {
        "name": "MLoad",
        "args": "FLOAT,STRING,FLOAT  ret FLOAT"
    },
    "102": {
        "name": "FileSaveDialog",
        "args": "STRING,STRING,STRING ret STRING  "
    },
    "103": {
        "name": "FileLoadDialog",
        "args": "STRING,STRING,STRING ret STRING  "
    },
    "104": {
        "name": "CreateObjectFromFile2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "105": {
        "name": "&",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "106": {
        "name": "|",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "107": {
        "name": "Quit",
        "args": "FLOAT"
    },
    "110": {
        "name": "jnz",
        "args": "HANDLE"
    },
    "111": {
        "name": "jz",
        "args": "HANDLE"
    },
    "112": {
        "name": "SetStatusText",
        "args": "FLOAT,STRING"
    },
    "113": {
        "name": "un_minus",
        "args": "FLOAT ret FLOAT"
    },
    "115": {
        "name": "gettickcount",
        "args": ""
    },
    "116": {
        "name": "<<",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "117": {
        "name": ">>",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "119": {
        "name": "Change",
        "args": "STRING,STRING,STRING ret STRING"
    },
    "120": {
        "name": "push",
        "args": ""
    },
    "121": {
        "name": "push_new",
        "args": ""
    },
    "122": {
        "name": "push_cst",
        "args": ""
    },
    "123": {
        "name": ":=",
        "args": "STRING,STRING"
    },
    "124": {
        "name": "+",
        "args": "STRING,STRING ret STRING"
    },
    "125": {
        "name": "Left",
        "args": "STRING,FLOAT ret STRING"
    },
    "126": {
        "name": "Right",
        "args": "STRING,FLOAT ret STRING"
    },
    "127": {
        "name": "Substr",
        "args": "STRING,FLOAT,FLOAT ret STRING"
    },
    "128": {
        "name": "Pos",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    "129": {
        "name": "Replicate",
        "args": "STRING,FLOAT ret STRING"
    },
    "130": {
        "name": "Lower",
        "args": "STRING ret STRING"
    },
    "131": {
        "name": "Upper",
        "args": "STRING ret STRING"
    },
    "132": {
        "name": "Ansi_To_Oem",
        "args": "STRING ret STRING"
    },
    "133": {
        "name": "Oem_To_Ansi",
        "args": "STRING ret STRING"
    },
    "134": {
        "name": "Compare",
        "args": "STRING,STRING ret FLOAT"
    },
    "135": {
        "name": "Comparei",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    "136": {
        "name": "Length",
        "args": "STRING ret FLOAT"
    },
    "137": {
        "name": "Ltrim",
        "args": "STRING ret STRING"
    },
    "138": {
        "name": "Rtrim",
        "args": "STRING ret STRING"
    },
    "139": {
        "name": "Alltrim",
        "args": "STRING ret STRING"
    },
    "140": {
        "name": "ASCII",
        "args": "STRING ret FLOAT"
    },
    "141": {
        "name": "Chr",
        "args": "FLOAT ret STRING"
    },
    "142": {
        "name": "String",
        "args": "FLOAT ret STRING"
    },
    "143": {
        "name": "Float",
        "args": "STRING ret FLOAT"
    },
    "144": {
        "name": "==",
        "args": "STRING,STRING ret FLOAT"
    },
    "145": {
        "name": "!=",
        "args": "STRING,STRING ret FLOAT"
    },
    "146": {
        "name": ">",
        "args": "STRING,STRING ret FLOAT"
    },
    "147": {
        "name": ">=",
        "args": "STRING,STRING ret FLOAT"
    },
    "148": {
        "name": "<",
        "args": "STRING,STRING ret FLOAT"
    },
    "149": {
        "name": "<=",
        "args": "STRING,STRING ret FLOAT"
    },
    "150": {
        "name": "RGB",
        "args": "FLOAT,FLOAT,FLOAT ret COLORREF"
    },
    "151": {
        "name": "system",
        "args": "FLOAT,[FLOAT] ret FLOAT"
    },
    "152": {
        "name": "systemstr",
        "args": "FLOAT ret STRING"
    },
    "153": {
        "name": "RegisterObject",
        "args": "HANDLE,HANDLE,STRING,FLOAT,FLOAT"
    },
    "154": {
        "name": "UnregisterObject",
        "args": "HANDLE,STRING,FLOAT"
    },
    "155": {
        "name": "SetCapture",
        "args": "HANDLE,STRING,FLOAT"
    },
    "156": {
        "name": "ReleaseCapture",
        "args": ""
    },
    "157": {
        "name": ":=_old",
        "args": "STRING,STRING"
    },
    "158": {
        "name": "GetMousePos",
        "args": "STRING,&FLOAT,&FLOAT ret FLOAT"
    },
    "159": {
        "name": "InputBox",
        "args": "STRING,STRING,STRING ret STRING  "
    },
    "160": {
        "name": "MessageBox",
        "args": "STRING,STRING,FLOAT  ret FLOAT   "
    },
    "161": {
        "name": "CreateStream",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    "162": {
        "name": "CloseStream",
        "args": "HANDLE ret FLOAT"
    },
    "163": {
        "name": "Seek",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "164": {
        "name": "StreamStatus",
        "args": "HANDLE ret FLOAT"
    },
    "165": {
        "name": "Eof",
        "args": "HANDLE ret FLOAT"
    },
    "167": {
        "name": "Getpos",
        "args": "HANDLE ret FLOAT"
    },
    "168": {
        "name": "GetSize",
        "args": "HANDLE ret FLOAT"
    },
    "169": {
        "name": "SetWidth",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "170": {
        "name": "Read",
        "args": "HANDLE ret FLOAT"
    },
    "171": {
        "name": "ReadLn",
        "args": "HANDLE ret STRING"
    },
    "172": {
        "name": "Write",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "173": {
        "name": "WriteLn",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "174": {
        "name": "GetLine",
        "args": "HANDLE,FLOAT,STRING ret STRING"
    },
    "175": {
        "name": "CopyBlock",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "176": {
        "name": "Truncate",
        "args": "HANDLE ret FLOAT"
    },
    "177": {
        "name": "randomize",
        "args": "FLOAT "
    },
    "197": {
        "name": "CreateObjectFromFile3d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "198": {
        "name": "Shell",
        "args": "STRING,STRING,STRING,FLOAT  ret FLOAT"
    },
    "199": {
        "name": "RGBEx",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT ret COLORREF"
    },
    "200": {
        "name": "LoadSpacewindow",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    "201": {
        "name": "OpenSchemeWindow",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    "202": {
        "name": "CloseWindow",
        "args": "STRING ret FLOAT"
    },
    "203": {
        "name": "GetWindowName",
        "args": "HANDLE ret STRING"
    },
    "204": {
        "name": "GetWindowSpace",
        "args": "STRING ret HANDLE"
    },
    "205": {
        "name": "SetClientSize",
        "args": " STRING,FLOAT,FLOAT ret FLOAT"
    },
    "206": {
        "name": "SetWindowTitle",
        "args": "STRING,STRING ret FLOAT"
    },
    "207": {
        "name": "GetWindowTitle",
        "args": "STRING ret STRING"
    },
    "208": {
        "name": "ShowWindow",
        "args": "STRING,FLOAT ret FLOAT"
    },
    "209": {
        "name": "SetWindowPos",
        "args": "STRING,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "210": {
        "name": "SetWindowOrg",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    "211": {
        "name": "SetWindowSize",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    "212": {
        "name": "IswindowVisible",
        "args": "STRING ret FLOAT"
    },
    "213": {
        "name": "IsIconic",
        "args": "STRING ret FLOAT"
    },
    "214": {
        "name": "IsWindowExist",
        "args": "STRING ret FLOAT"
    },
    "215": {
        "name": "BringWindowToTop",
        "args": "STRING ret FLOAT"
    },
    "216": {
        "name": "CascadeWindows",
        "args": ""
    },
    "217": {
        "name": "Tile",
        "args": "FLOAT"
    },
    "218": {
        "name": "ArrangeIcons",
        "args": ""
    },
    "219": {
        "name": "GetWindowOrgX",
        "args": "STRING ret FLOAT"
    },
    "220": {
        "name": "GetWindowOrgY",
        "args": "STRING ret FLOAT"
    },
    "221": {
        "name": "GetWindowWidth",
        "args": "STRING ret FLOAT"
    },
    "222": {
        "name": "GetWindowHeight",
        "args": "STRING ret FLOAT"
    },
    "223": {
        "name": "GethObject",
        "args": ""
    },
    "224": {
        "name": "GetObject2dByName",
        "args": "HANDLE,HANDLE,STRING ret HANDLE"
    },
    "225": {
        "name": "GetClientWidth",
        "args": " STRING  ret FLOAT"
    },
    "226": {
        "name": "GetClientHeight",
        "args": " STRING  ret FLOAT"
    },
    "227": {
        "name": "ChoseColorDialog",
        "args": " STRING,COLORREF       ret COLORREF"
    },
    "228": {
        "name": "joygetx",
        "args": " FLOAT  ret FLOAT"
    },
    "229": {
        "name": "joygety",
        "args": " FLOAT  ret FLOAT"
    },
    "230": {
        "name": "joygetz",
        "args": " FLOAT  ret FLOAT"
    },
    "231": {
        "name": "joygetbuttons",
        "args": " FLOAT  ret FLOAT"
    },
    "232": {
        "name": "GetAsyncKeyState",
        "args": " FLOAT  ret FLOAT"
    },
    "233": {
        "name": "GetClassDirectory",
        "args": " STRING  ret STRING"
    },
    "234": {
        "name": "GetProjectDirectory",
        "args": ""
    },
    "235": {
        "name": "GetWindowsDirectory",
        "args": ""
    },
    "236": {
        "name": "GetSystemDirectory",
        "args": ""
    },
    "237": {
        "name": "GetPathFromFile",
        "args": " STRING  ret STRING"
    },
    "238": {
        "name": "AddSlash",
        "args": " STRING  ret STRING"
    },
    "239": {
        "name": "GetStratumDirectory",
        "args": ""
    },
    "240": {
        "name": "WinExecute",
        "args": " STRING,FLOAT  ret FLOAT"
    },
    "241": {
        "name": "SetScrollRange",
        "args": "STRING,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "242": {
        "name": "GetActualWidth2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "243": {
        "name": "GetActualHeight2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "244": {
        "name": "SaveRectArea2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "245": {
        "name": "LockSpace2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "246": {
        "name": "LoadMenu",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    "247": {
        "name": "DeleteMenu",
        "args": "STRING ret FLOAT"
    },
    "248": {
        "name": "RegisterObject",
        "args": "STRING,HANDLE,STRING,FLOAT,FLOAT"
    },
    "249": {
        "name": "UnregisterObject",
        "args": "STRING,STRING,FLOAT"
    },
    "250": {
        "name": "MCISENDSTRINGstr",
        "args": " STRING ret STRING "
    },
    "251": {
        "name": "MCISENDSTRING",
        "args": " STRING ret FLOAT "
    },
    "252": {
        "name": "MCISENDSTRINGEX",
        "args": " STRING,FLOAT ret STRING "
    },
    "253": {
        "name": "GETLASTMCIERROR",
        "args": ""
    },
    "254": {
        "name": "GETMCIERRORSTR",
        "args": " FLOAT ret STRING"
    },
    "255": {
        "name": "SetCalcOrder",
        "args": "STRING,HANDLE,FLOAT ret FLOAT"
    },
    "256": {
        "name": "GetCalcOrder",
        "args": "STRING,HANDLE ret FLOAT"
    },
    "296": {
        "name": "GetObject3dFromPoint2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,&HANDLE,&FLOAT ret HANDLE"
    },
    "297": {
        "name": "SweepAndExtrude3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ,FLOAT,FLOAT,FLOAT,FLOAT,COLORREF,FLOAT ret HANDLE"
    },
    "298": {
        "name": "IsObjectsIntersect2d",
        "args": "HANDLE,HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "299": {
        "name": "SetLineArrows2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "300": {
        "name": "CreateLine2d",
        "args": "HANDLE,HANDLE,HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    "301": {
        "name": "AddPoint2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "302": {
        "name": "DelPoint2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "303": {
        "name": "GetBrushObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "304": {
        "name": "GetPenObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "305": {
        "name": "GetRGNCreateMode",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "306": {
        "name": "GetVectorNumPoints2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "307": {
        "name": "GetVectorPoint2dx",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "308": {
        "name": "GetVectorPoint2dy",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "309": {
        "name": "SetBrushObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret HANDLE"
    },
    "310": {
        "name": "SetPenObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret HANDLE"
    },
    "311": {
        "name": "SetRGNCreateMode",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "312": {
        "name": "SetVectorPoint2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "313": {
        "name": "CreatePen2d",
        "args": "HANDLE,FLOAT,FLOAT,COLORREF,FLOAT ret HANDLE"
    },
    "314": {
        "name": "GetPenColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    "315": {
        "name": "GetPenRop2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "316": {
        "name": "GetPenStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "317": {
        "name": "GetPenWidth2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "318": {
        "name": "SetPenColor2d",
        "args": "HANDLE,HANDLE,COLORREF ret FLOAT"
    },
    "319": {
        "name": "SetPenROP2d",
        "args": "HANDLE,HANDLE,FLOAT    ret FLOAT"
    },
    "320": {
        "name": "SetPenStyle2d",
        "args": "HANDLE,HANDLE,FLOAT    ret FLOAT"
    },
    "321": {
        "name": "SetPenWidth2d",
        "args": "HANDLE,HANDLE,FLOAT    ret FLOAT"
    },
    "322": {
        "name": "DeleteTool2d",
        "args": "HANDLE,FLOAT,HANDLE  ret FLOAT "
    },
    "323": {
        "name": "DeleteObject2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "324": {
        "name": "GetObjectOrg2dx",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "325": {
        "name": "GetObjectOrg2dy",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "326": {
        "name": "GetObjectParent2d",
        "args": "HANDLE,HANDLE  ret HANDLE"
    },
    "327": {
        "name": "GetObjectAngle2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "328": {
        "name": "GetObjectWidth2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "329": {
        "name": "GetObjectHeight2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "330": {
        "name": "GetObjectType2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "331": {
        "name": "SetObjectOrg2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
    },
    "332": {
        "name": "SetObjectSize2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT  ret FLOAT"
    },
    "333": {
        "name": "CreateBrush2d",
        "args": "HANDLE,FLOAT,FLOAT,COLORREF,HANDLE,FLOAT ret HANDLE"
    },
    "334": {
        "name": "SetPoints2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "335": {
        "name": "CreateDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "336": {
        "name": "CreateDoubleDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "337": {
        "name": "CreateRDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "338": {
        "name": "CreateRDoubleDIB2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "339": {
        "name": "CreateBitmap2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    "340": {
        "name": "CreateDoubleBitmap2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    "341": {
        "name": "GetSpaceOrg2dy",
        "args": "HANDLE ret FLOAT"
    },
    "342": {
        "name": "GetSpaceOrg2dx",
        "args": "HANDLE ret FLOAT"
    },
    "343": {
        "name": "SetSpaceOrg2d",
        "args": "HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "344": {
        "name": "SetScaleSpace2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "345": {
        "name": "GetScaleSpace2d",
        "args": "HANDLE ret FLOAT"
    },
    "346": {
        "name": "SndPlaySound",
        "args": "STRING,FLOAT  ret FLOAT"
    },
    "347": {
        "name": "GetBottomObject2d",
        "args": "HANDLE ret HANDLE"
    },
    "348": {
        "name": "GetUpperObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "349": {
        "name": "GetObjectFromZOrder2d",
        "args": "HANDLE,FLOAT ret HANDLE "
    },
    "350": {
        "name": "GetLowerObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "351": {
        "name": "GetTopObject2d",
        "args": "HANDLE ret HANDLE         "
    },
    "352": {
        "name": "GetZOrder2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    "353": {
        "name": "ObjectToBottom2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    "354": {
        "name": "ObjectToTop2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    "355": {
        "name": "SetZOrder2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT "
    },
    "356": {
        "name": "SwapObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    "357": {
        "name": "SetBitmapSrcRect2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "358": {
        "name": "SetObjectAttribute2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "359": {
        "name": "GetObjectAttribute2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "360": {
        "name": "CreateFont2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT ret HANDLE"
    },
    "361": {
        "name": "CreateString2d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "362": {
        "name": "CreateText2d",
        "args": "HANDLE,HANDLE,HANDLE,COLORREF,COLORREF ret HANDLE"
    },
    "363": {
        "name": "CreateRasterText2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "364": {
        "name": "SetShowObject2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "365": {
        "name": "SetString2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    "366": {
        "name": "AddGroupItem2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    "367": {
        "name": "CreateGroup2d",
        "args": "HANDLE,[HANDLE] ret HANDLE"
    },
    "368": {
        "name": "DeleteGroup2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "369": {
        "name": "DelGroupItem2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    "370": {
        "name": "GetGroupItem2d",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    "372": {
        "name": "GetGroupItemsNum2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "373": {
        "name": "IsGroupContainObject2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    "374": {
        "name": "SetGroupItem2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    "375": {
        "name": "SetGroupItems2d",
        "args": "HANDLE,HANDLE,[HANDLE] ret FLOAT"
    },
    "376": {
        "name": "CopyToClipboard2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "377": {
        "name": "PasteFromClipboard2d",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "378": {
        "name": "GetObjectName2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    "379": {
        "name": "SetObjectName2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    "380": {
        "name": "GetObjectFromPoint2d",
        "args": "HANDLE,FLOAT,FLOAT ret HANDLE"
    },
    "381": {
        "name": "GetLastPrimary2d",
        "args": ""
    },
    "382": {
        "name": "RotateObject2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT  ret FLOAT"
    },
    "383": {
        "name": "ShowObject2d",
        "args": "HANDLE,HANDLE"
    },
    "384": {
        "name": "HideObject2d",
        "args": "HANDLE,HANDLE"
    },
    "385": {
        "name": "StdHyperJump",
        "args": "HANDLE,FLOAT,FLOAT,HANDLE,FLOAT"
    },
    "386": {
        "name": "GetObjectCount",
        "args": "STRING ret FLOAT"
    },
    "387": {
        "name": "GetHObjectByNum",
        "args": "STRING,FLOAT ret HANDLE"
    },
    "389": {
        "name": "GetObjectClass",
        "args": "STRING,HANDLE ret STRING"
    },
    "390": {
        "name": "FLOAT",
        "args": ""
    },
    "391": {
        "name": "GetControlText2d",
        "args": "HANDLE,HANDLE ret STRING "
    },
    "392": {
        "name": "SetControlText2d",
        "args": "HANDLE,HANDLE,STRING  ret FLOAT   "
    },
    "393": {
        "name": "CheckDlgButton2d",
        "args": "HANDLE,HANDLE,FLOAT  ret FLOAT     "
    },
    "394": {
        "name": "IsDlgButtonChecked2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "395": {
        "name": "EnableControl2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "396": {
        "name": "SetBrushHatch2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "397": {
        "name": "GetString2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    "398": {
        "name": "GetClassName",
        "args": "STRING ret STRING"
    },
    "401": {
        "name": "GetBrushColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    "402": {
        "name": "GetBrushRop2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "403": {
        "name": "GetBrushDib2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "404": {
        "name": "GetBrushStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "405": {
        "name": "GetBrushHatch2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "406": {
        "name": "SetBrushColor2d",
        "args": "HANDLE,HANDLE,COLORREF ret FLOAT"
    },
    "407": {
        "name": "SetBrushRop2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "408": {
        "name": "SetBrushDib2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    "409": {
        "name": "SetBrushStyle2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "410": {
        "name": "CreateObject",
        "args": "STRING,STRING,STRING,FLOAT,FLOAT ret HANDLE"
    },
    "411": {
        "name": "DeleteObject",
        "args": "STRING,HANDLE,FLOAT ret FLOAT"
    },
    "412": {
        "name": "CreateClass",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    "413": {
        "name": "DeleteClass",
        "args": "STRING"
    },
    "414": {
        "name": "OpenClassScheme",
        "args": "STRING,FLOAT ret HANDLE"
    },
    "415": {
        "name": "CloseClassScheme",
        "args": "STRING ret FLOAT"
    },
    "416": {
        "name": "CreateLink",
        "args": "STRING,HANDLE,HANDLE ret HANDLE"
    },
    "417": {
        "name": "SetLinkVars",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    "418": {
        "name": "RemoveLink",
        "args": "STRING,HANDLE ret FLOAT"
    },
    "419": {
        "name": "GetUniqueClassName",
        "args": "STRING ret STRING"
    },
    "420": {
        "name": "GethObjectByName",
        "args": "STRING ret HANDLE"
    },
    "421": {
        "name": "CreateWindowEx",
        "args": "STRING,STRING,STRING,FLOAT,FLOAT,FLOAT,FLOAT,STRING ret HANDLE"
    },
    "430": {
        "name": "GetVarF",
        "args": "STRING,STRING ret FLOAT"
    },
    "431": {
        "name": "GetVarS",
        "args": "STRING,STRING ret STRING"
    },
    "432": {
        "name": "GetVarC",
        "args": "STRING,STRING ret COLORREF"
    },
    "433": {
        "name": "SetVar",
        "args": "STRING,STRING,FLOAT"
    },
    "434": {
        "name": "SetVar",
        "args": "STRING,STRING,STRING"
    },
    "435": {
        "name": "SetVar",
        "args": "STRING,STRING,COLORREF"
    },
    "436": {
        "name": "CreateLink",
        "args": "STRING,STRING,STRING ret HANDLE"
    },
    "437": {
        "name": "SetModelText",
        "args": "STRING,HANDLE ret FLOAT"
    },
    "438": {
        "name": "GetModelText",
        "args": "STRING,HANDLE ret FLOAT"
    },
    "439": {
        "name": "GetAngleByXY",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "440": {
        "name": "GetObjectFromPoint2dEx",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "441": {
        "name": "OpenVideo",
        "args": "STRING,FLOAT ret HANDLE"
    },
    "442": {
        "name": "CloseVideo",
        "args": "HANDLE ret FLOAT"
    },
    "446": {
        "name": "CreateVideoFrame2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "447": {
        "name": "VideoSetPos2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "448": {
        "name": "FrameSetPos2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "449": {
        "name": "VideoPlay2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "450": {
        "name": "VideoPause2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "451": {
        "name": "VideoResume2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "452": {
        "name": "VideoStop2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "453": {
        "name": "FrameSetSrcRect2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "454": {
        "name": "VideoGetPos2d",
        "args": "HANDLE ret FLOAT"
    },
    "455": {
        "name": "FrameGetPos2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "456": {
        "name": "FrameGetVideo2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "457": {
        "name": "BeginWriteVideo2d",
        "args": "HANDLE,STRING,FLOAT,FLOAT,FLOAT,FLOAT,STRING ret HANDLE"
    },
    "458": {
        "name": "VideoDialog",
        "args": "HANDLE ret FLOAT"
    },
    "459": {
        "name": "WriteVideoFrame2d",
        "args": "HANDLE ret FLOAT"
    },
    "460": {
        "name": "SetControlStyle2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "461": {
        "name": "GetControlStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "462": {
        "name": "LBAddString",
        "args": "HANDLE,HANDLE,STRING  ret FLOAT"
    },
    "463": {
        "name": "LBInsertString",
        "args": "HANDLE,HANDLE,STRING,FLOAT ret FLOAT"
    },
    "464": {
        "name": "LBGetString",
        "args": "HANDLE,HANDLE,FLOAT ret STRING"
    },
    "465": {
        "name": "LBClearList",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "466": {
        "name": "LBDeleteString",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "467": {
        "name": "LBGetCount",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "468": {
        "name": "LBGetSelIndex",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "469": {
        "name": "LBSetSelIndex",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "470": {
        "name": "LBGetCaretIndex",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "471": {
        "name": "LBSetCaretIndex",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "472": {
        "name": "LBFindString",
        "args": "HANDLE,HANDLE,STRING,FLOAT ret FLOAT"
    },
    "473": {
        "name": "LBFindStringExact",
        "args": "HANDLE,HANDLE,STRING,FLOAT ret FLOAT"
    },
    "474": {
        "name": "GetDibPixel2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret COLORREF"
    },
    "475": {
        "name": "GetTime",
        "args": "&FLOAT,&FLOAT,&FLOAT,&FLOAT"
    },
    "478": {
        "name": "VFunction",
        "args": ""
    },
    "479": {
        "name": "DLLFunction",
        "args": ""
    },
    "480": {
        "name": "GetElement",
        "args": "FLOAT,[FLOAT] ret FLOAT"
    },
    "481": {
        "name": "SetElement",
        "args": "FLOAT,[FLOAT] ret FLOAT"
    },
    "482": {
        "name": "EmptySpace2d",
        "args": "HANDLE ret FLOAT"
    },
    "485": {
        "name": "CreatePolyLine2d",
        "args": "HANDLE,HANDLE,HANDLE,[FLOAT,FLOAT] ret HANDLE"
    },
    "486": {
        "name": "GetNameByHandle",
        "args": "STRING,HANDLE ret STRING"
    },
    "487": {
        "name": "SetSpaceLayers2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "488": {
        "name": "GetSpaceLayers2d",
        "args": "HANDLE  ret FLOAT"
    },
    "491": {
        "name": "LogMessage",
        "args": "STRING"
    },
    "492": {
        "name": "SetVarsToDefault",
        "args": "STRING ret FLOAT"
    },
    "493": {
        "name": "GetTextObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "494": {
        "name": "GetTextString2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "495": {
        "name": "GetTextFont2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "496": {
        "name": "LoadObjectState",
        "args": "STRING,STRING ret FLOAT"
    },
    "497": {
        "name": "SaveObjectState",
        "args": "STRING,STRING ret FLOAT"
    },
    "498": {
        "name": "GetWindowProp",
        "args": "STRING,STRING ret STRING"
    },
    "499": {
        "name": "_CameraProc3d",
        "args": "STRING,HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "500": {
        "name": "DbOpenBase",
        "args": "STRING,STRING,STRING,STRING ret HANDLE"
    },
    "501": {
        "name": "DbOpenTable",
        "args": "HANDLE,STRING,STRING,STRING,STRING,FLOAT,STRING ret HANDLE"
    },
    "502": {
        "name": "DbCloseBase",
        "args": "HANDLE ret FLOAT"
    },
    "503": {
        "name": "DbCloseTable",
        "args": "HANDLE ret FLOAT"
    },
    "504": {
        "name": "DbGetError",
        "args": ""
    },
    "505": {
        "name": "DbGetErrorStr",
        "args": "FLOAT ret STRING"
    },
    "506": {
        "name": "DbSetDir",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "507": {
        "name": "DbCloseAll",
        "args": ""
    },
    "508": {
        "name": "DbGoTop",
        "args": "HANDLE ret FLOAT"
    },
    "509": {
        "name": "DbGoBottom",
        "args": "HANDLE ret FLOAT"
    },
    "510": {
        "name": "DbSkip",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "511": {
        "name": "DbFieldId",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "512": {
        "name": "DbGetField",
        "args": "HANDLE,FLOAT ret STRING"
    },
    "513": {
        "name": "DbSQL",
        "args": "HANDLE,STRING,FLOAT ret HANDLE"
    },
    "514": {
        "name": "DbGetCount",
        "args": "HANDLE ret FLOAT"
    },
    "515": {
        "name": "DbBrowse",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    "516": {
        "name": "DBGetFieldN",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "517": {
        "name": "DBGetFieldName",
        "args": "HANDLE,FLOAT ret STRING"
    },
    "518": {
        "name": "DBGetFieldType",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "519": {
        "name": "DbInsertRecord",
        "args": "HANDLE ret FLOAT"
    },
    "520": {
        "name": "DbAppendRecord",
        "args": "HANDLE ret FLOAT"
    },
    "521": {
        "name": "DbDeleteRecord",
        "args": "HANDLE ret FLOAT"
    },
    "522": {
        "name": "DbSetField",
        "args": "HANDLE,FLOAT,STRING ret FLOAT"
    },
    "523": {
        "name": "DbSetField",
        "args": "HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "524": {
        "name": "DbSetField",
        "args": "HANDLE,STRING,STRING ret FLOAT"
    },
    "525": {
        "name": "DbSetField",
        "args": "HANDLE,STRING,FLOAT ret FLOAT"
    },
    "526": {
        "name": "DbGetFieldN",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "527": {
        "name": "DbGetField",
        "args": "HANDLE,STRING ret STRING"
    },
    "528": {
        "name": "DbCreateTable",
        "args": "HANDLE,STRING,STRING,STRING,FLOAT ret FLOAT"
    },
    "529": {
        "name": "DbZap",
        "args": "HANDLE ret FLOAT"
    },
    "530": {
        "name": "DbAddIndex",
        "args": "HANDLE, STRING, FLOAT, STRING, FLOAT, FLOAT, STRING, STRING,[STRING] ret FLOAT"
    },
    "531": {
        "name": "DbDeleteIndex",
        "args": "HANDLE, STRING, FLOAT, STRING ret FLOAT"
    },
    "532": {
        "name": "DbOpenIndex",
        "args": "HANDLE, STRING, FLOAT ret FLOAT"
    },
    "533": {
        "name": "DbSwitchToIndex",
        "args": "HANDLE, STRING, FLOAT, STRING, FLOAT ret FLOAT"
    },
    "534": {
        "name": "DbCloseIndex",
        "args": "HANDLE, STRING ret FLOAT"
    },
    "535": {
        "name": "DbRegenIndex",
        "args": "HANDLE, STRING, FLOAT, STRING ret FLOAT"
    },
    "536": {
        "name": "DbGetBlob",
        "args": "HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    "537": {
        "name": "DbPutBlob",
        "args": "HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    "538": {
        "name": "DbFreeBlob",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "539": {
        "name": "DbPackFile",
        "args": "HANDLE  ret FLOAT"
    },
    "540": {
        "name": "DbSortTable",
        "args": "HANDLE,FLOAT,[STRING] ret FLOAT"
    },
    "541": {
        "name": "DbGetDelMode",
        "args": "HANDLE         ret FLOAT"
    },
    "542": {
        "name": "DbSetDelMode",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "543": {
        "name": "DbSetCodePage",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "544": {
        "name": "DbGetCodePage",
        "args": "HANDLE         ret FLOAT"
    },
    "545": {
        "name": "DbLock",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "546": {
        "name": "DbUnlock",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "547": {
        "name": "DbUndeleteRecord",
        "args": "HANDLE         ret FLOAT"
    },
    "548": {
        "name": "DbCopyTo",
        "args": "HANDLE,STRING,STRING ret FLOAT"
    },
    "549": {
        "name": "DbSetToKey",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "550": {
        "name": "DbGetFieldCount",
        "args": "HANDLE ret FLOAT"
    },
    "580": {
        "name": "DbSetTable",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    "581": {
        "name": "DbSetControlTable",
        "args": "HANDLE,HANDLE,HANDLE,STRING ret FLOAT"
    },
    "582": {
        "name": "DbGetPos",
        "args": "HANDLE ret FLOAT"
    },
    "600": {
        "name": "SendMessage",
        "args": "STRING,STRING,[STRING,STRING]"
    },
    "601": {
        "name": "SetObjectName",
        "args": "STRING,HANDLE,STRING ret FLOAT"
    },
    "602": {
        "name": "SetText2d",
        "args": "HANDLE,HANDLE,HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    "603": {
        "name": "GetTextFgColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    "604": {
        "name": "GetTextBkColor2d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    "605": {
        "name": "Dialog",
        "args": "STRING,STRING,STRING ret FLOAT"
    },
    "606": {
        "name": "DialogEx",
        "args": "STRING,[STRING,STRING,STRING] ret FLOAT"
    },
    "607": {
        "name": "GetLink",
        "args": "STRING,HANDLE,HANDLE ret HANDLE"
    },
    "608": {
        "name": "DialogBox",
        "args": "STRING,HANDLE ret FLOAT"
    },
    "609": {
        "name": "GetRValue",
        "args": "COLORREF ret FLOAT"
    },
    "610": {
        "name": "GetGValue",
        "args": "COLORREF ret FLOAT"
    },
    "611": {
        "name": "GetBValue",
        "args": "COLORREF ret FLOAT"
    },
    "612": {
        "name": "GetToolRef2d",
        "args": "HANDLE,FLOAT,HANDLE  ret FLOAT "
    },
    "613": {
        "name": "GetNextTool2d",
        "args": "HANDLE,FLOAT,HANDLE  ret HANDLE"
    },
    "614": {
        "name": "GetNextObject2d",
        "args": "HANDLE,HANDLE ret HANDLE  "
    },
    "635": {
        "name": "GetPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    "636": {
        "name": "SetPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT  "
    },
    "637": {
        "name": "SetPrimitive3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,COLORREF,[FLOAT] ret FLOAT "
    },
    "638": {
        "name": "CreateObject3d",
        "args": "HANDLE ret HANDLE  "
    },
    "639": {
        "name": "DelPrimitive3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT   "
    },
    "640": {
        "name": "GetNumPrimitives3d",
        "args": "HANDLE,HANDLE ret FLOAT   "
    },
    "641": {
        "name": "AddPrimitive3d",
        "args": "HANDLE,HANDLE,FLOAT,COLORREF,[FLOAT] ret FLOAT "
    },
    "642": {
        "name": "DelPoint3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "643": {
        "name": "GetNumPoints3d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    "644": {
        "name": "AddPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT  "
    },
    "645": {
        "name": "SetObjectMatrix3d",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    "646": {
        "name": "GetObjectMatrix3d",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    "647": {
        "name": "TransformObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "648": {
        "name": "RotateObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "649": {
        "name": "GetObjectBase3dM",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    "650": {
        "name": "SetObjectBase3d",
        "args": "HANDLE,HANDLE, FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "651": {
        "name": "GetObjectBase3d",
        "args": "HANDLE,HANDLE,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    "652": {
        "name": "GetSpace3d",
        "args": ""
    },
    "653": {
        "name": "GetObjectDimension3d",
        "args": "HANDLE,HANDLE, FLOAT ret FLOAT"
    },
    "654": {
        "name": "TransformObject3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "655": {
        "name": "RotateObject3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret FLOAT"
    },
    "656": {
        "name": "SetObjectColor3d",
        "args": "HANDLE,HANDLE,COLORREF ret FLOAT"
    },
    "657": {
        "name": "CreateDefCamera3d",
        "args": "HANDLE,FLOAT ret HANDLE"
    },
    "658": {
        "name": "SwitchToCamera3d",
        "args": ""
    },
    "659": {
        "name": "GetActiveCamera",
        "args": ""
    },
    "660": {
        "name": "CreateSpace3d",
        "args": "HANDLE ret HANDLE"
    },
    "661": {
        "name": "DeleteSpace3d",
        "args": "HANDLE ret FLOAT"
    },
    "662": {
        "name": "Create3dView",
        "args": ""
    },
    "663": {
        "name": "GetObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "664": {
        "name": "SetObjectPoints3d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "665": {
        "name": "GetObjectColor3d",
        "args": "HANDLE,HANDLE ret COLORREF"
    },
    "666": {
        "name": "SetCurrentObject2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "667": {
        "name": "GetCurrentObject2d",
        "args": "HANDLE ret HANDLE        "
    },
    "668": {
        "name": "CreateSurface3d",
        "args": "HANDLE,FLOAT,FLOAT,COLORREF ret HANDLE"
    },
    "669": {
        "name": "FitToCamera3d",
        "args": "HANDLE,HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "670": {
        "name": "SetCameraPoint3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "671": {
        "name": "PushCrdSystem3d",
        "args": "HANDLE ret FLOAT"
    },
    "672": {
        "name": "PopCrdSystem3d",
        "args": "HANDLE ret FLOAT"
    },
    "673": {
        "name": "SelectLocalCrd3d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "674": {
        "name": "SelectWorldCrd3d",
        "args": "HANDLE ret FLOAT"
    },
    "675": {
        "name": "SelectViewCrd3d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "676": {
        "name": "TransformCamera3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "677": {
        "name": "SetColors3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT "
    },
    "678": {
        "name": "GetColors3d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT "
    },
    "679": {
        "name": "GetMaterialByName3d",
        "args": "HANDLE,STRING ret HANDLE"
    },
    "700": {
        "name": "new",
        "args": ""
    },
    "701": {
        "name": "delete",
        "args": "HANDLE"
    },
    "702": {
        "name": "vClearAll",
        "args": ""
    },
    "703": {
        "name": "vInsert",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "704": {
        "name": "vDelete",
        "args": "HANDLE,FLOAT ret FLOAT "
    },
    "705": {
        "name": "vGetCount",
        "args": "HANDLE ret FLOAT"
    },
    "706": {
        "name": "vGetType",
        "args": "HANDLE,FLOAT ret STRING"
    },
    "707": {
        "name": "vGetF",
        "args": "HANDLE,FLOAT,STRING ret FLOAT    "
    },
    "708": {
        "name": "vGetS",
        "args": "HANDLE,FLOAT,STRING ret STRING   "
    },
    "709": {
        "name": "vGetH",
        "args": "HANDLE,FLOAT,STRING ret HANDLE   "
    },
    "710": {
        "name": "vSet",
        "args": "HANDLE,FLOAT,STRING,FLOAT"
    },
    "711": {
        "name": "vSet",
        "args": "HANDLE,FLOAT,STRING,STRING"
    },
    "712": {
        "name": "vSet",
        "args": "HANDLE,FLOAT,STRING,HANDLE"
    },
    "713": {
        "name": "GetControlText2ds",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT "
    },
    "714": {
        "name": "SetControlText2ds",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT   "
    },
    "720": {
        "name": "LoadProject",
        "args": "STRING ret FLOAT"
    },
    "721": {
        "name": "UnloadProject",
        "args": "STRING ret FLOAT"
    },
    "722": {
        "name": "SetActiveProject",
        "args": "STRING ret FLOAT"
    },
    "723": {
        "name": "IsProjectExist",
        "args": "STRING ret FLOAT"
    },
    "725": {
        "name": "SetProjectProp",
        "args": "STRING,STRING,FLOAT ret FLOAT"
    },
    "726": {
        "name": "GetProjectProp",
        "args": "STRING,STRING ret FLOAT"
    },
    "727": {
        "name": "SetProjectProp",
        "args": "STRING,STRING,STRING ret FLOAT"
    },
    "728": {
        "name": "ApplyTexture3d",
        "args": "HANDLE,HANDLE,HANDLE,HANDLE,[FLOAT] ret FLOAT"
    },
    "729": {
        "name": "RemoveTexture3d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "730": {
        "name": "CreateDir",
        "args": "STRING ret FLOAT"
    },
    "731": {
        "name": "DeleteDir",
        "args": "STRING ret FLOAT"
    },
    "732": {
        "name": "FileRename",
        "args": "STRING,STRING ret FLOAT"
    },
    "733": {
        "name": "FileCopy",
        "args": "STRING,STRING ret FLOAT"
    },
    "734": {
        "name": "FileExist",
        "args": "STRING ret FLOAT"
    },
    "735": {
        "name": "FileDelete",
        "args": "STRING ret FLOAT"
    },
    "736": {
        "name": "GetFileList",
        "args": "STRING,FLOAT ret HANDLE"
    },
    "737": {
        "name": "GetActualSize2d",
        "args": "HANDLE,HANDLE,&FLOAT,&FLOAT ret FLOAT"
    },
    "738": {
        "name": "SetBkBrush2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "739": {
        "name": "GetBkBrush2d",
        "args": "HANDLE         ret HANDLE"
    },
    "740": {
        "name": "diff1",
        "args": "FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "741": {
        "name": "equation",
        "args": "FLOAT"
    },
    "742": {
        "name": "diff2",
        "args": "FLOAT,FLOAT,&FLOAT,&FLOAT,&FLOAT,&FLOAT,FLOAT ret FLOAT"
    },
    "743": {
        "name": "dequation",
        "args": "FLOAT"
    },
    "744": {
        "name": "GetDibObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "745": {
        "name": "SetDibObject2d",
        "args": "HANDLE,HANDLE,HANDLE  ret FLOAT"
    },
    "746": {
        "name": "GetDDibObject2d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "747": {
        "name": "SetDDibObject2d",
        "args": "HANDLE,HANDLE,HANDLE  ret FLOAT"
    },
    "748": {
        "name": "GetDate",
        "args": "&FLOAT,&FLOAT,&FLOAT"
    },
    "749": {
        "name": "GetVideoMarker",
        "args": "HANDLE,COLORREF,COLORREF,COLORREF,&FLOAT,&FLOAT ret FLOAT"
    },
    "750": {
        "name": "GetVarInfo",
        "args": "STRING,FLOAT,&STRING,&STRING,&STRING,&STRING ret FLOAT"
    },
    "751": {
        "name": "GetVarCount",
        "args": "STRING ret FLOAT"
    },
    "752": {
        "name": "vSave",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "753": {
        "name": "vLoad",
        "args": "HANDLE ret HANDLE"
    },
    "754": {
        "name": "GetBitmapSrcRect2d",
        "args": "HANDLE,HANDLE,&FLOAT,&FLOAT,&FLOAT,&FLOAT ret FLOAT"
    },
    "755": {
        "name": "SetHyperJump2d",
        "args": "HANDLE,HANDLE,FLOAT,[STRING] ret FLOAT"
    },
    "756": {
        "name": "SetRDib2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    "757": {
        "name": "SetRDoubleDib2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    "758": {
        "name": "GetRDib2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    "759": {
        "name": "GetRDoubleDib2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    "760": {
        "name": "MSort",
        "args": "FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "761": {
        "name": "DuplicateObject3d",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "762": {
        "name": "CheckMenuItem",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    "763": {
        "name": "EnableMenuItem",
        "args": "STRING,FLOAT,FLOAT ret FLOAT"
    },
    "770": {
        "name": "+",
        "args": "STRING,FLOAT ret STRING"
    },
    "771": {
        "name": "+",
        "args": "FLOAT,STRING ret STRING"
    },
    "772": {
        "name": "GetScreenWidth",
        "args": ""
    },
    "773": {
        "name": "GetScreenHeight",
        "args": ""
    },
    "774": {
        "name": "GetWorkAreaX",
        "args": ""
    },
    "775": {
        "name": "GetWorkAreaY",
        "args": ""
    },
    "776": {
        "name": "GetWorkAreaWidth",
        "args": ""
    },
    "777": {
        "name": "GetWorkAreaHeight",
        "args": ""
    },
    "778": {
        "name": "GetKeyboardLayout",
        "args": ""
    },
    "779": {
        "name": "Substr",
        "args": "STRING,FLOAT ret STRING"
    },
    "782": {
        "name": "SetWindowTransparent",
        "args": "STRING, FLOAT ret FLOAT"
    },
    "783": {
        "name": "SetWindowTransparentColor",
        "args": "STRING, COLORREF ret FLOAT"
    },
    "784": {
        "name": "SetWindowRegion",
        "args": "STRING, HANDLE ret FLOAT"
    },
    "785": {
        "name": "GetTitleHeight",
        "args": ""
    },
    "786": {
        "name": "GetSmallTitleHeight",
        "args": ""
    },
    "787": {
        "name": "GetFixedFrameWidth",
        "args": ""
    },
    "788": {
        "name": "GetFixedFrameHeight",
        "args": ""
    },
    "789": {
        "name": "GetSizeFrameWidth",
        "args": ""
    },
    "790": {
        "name": "GetSizeFrameHeight",
        "args": ""
    },
    "791": {
        "name": "WindowInTaskBar",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "793": {
        "name": "SetWindowTransparent",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "794": {
        "name": "SetWindowTransparentColor",
        "args": "HANDLE, COLORREF ret FLOAT"
    },
    "795": {
        "name": "SetWindowRegion",
        "args": "HANDLE, HANDLE ret FLOAT"
    },
    "796": {
        "name": "ShowCursor",
        "args": "FLOAT"
    },
    "797": {
        "name": "ScreenShot",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "798": {
        "name": "LockObject2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "799": {
        "name": "GetVarInfo",
        "args": "STRING,FLOAT,&STRING,&STRING,&STRING,&STRING,&FLOAT ret FLOAT"
    },
    "800": {
        "name": "++",
        "args": "FLOAT"
    },
    "802": {
        "name": "AudioOpenSound",
        "args": "STRING ret HANDLE"
    },
    "803": {
        "name": "AudioPlay",
        "args": "HANDLE"
    },
    "804": {
        "name": "AudioStop",
        "args": "HANDLE"
    },
    "805": {
        "name": "AudioIsPlaying",
        "args": "HANDLE ret FLOAT"
    },
    "806": {
        "name": "AudioReset",
        "args": "HANDLE"
    },
    "807": {
        "name": "AudioSetRepeat",
        "args": "HANDLE,FLOAT"
    },
    "808": {
        "name": "AudioGetRepeat",
        "args": "HANDLE ret FLOAT"
    },
    "809": {
        "name": "AudioSetVolume",
        "args": "HANDLE,FLOAT"
    },
    "810": {
        "name": "AudioGetVolume",
        "args": "HANDLE ret FLOAT"
    },
    "811": {
        "name": "AudioSetBalance",
        "args": "HANDLE,FLOAT"
    },
    "812": {
        "name": "AudioGetBalance",
        "args": "HANDLE ret FLOAT"
    },
    "813": {
        "name": "AudioSetTone",
        "args": "HANDLE,FLOAT"
    },
    "814": {
        "name": "AudioGetTone",
        "args": "HANDLE ret FLOAT"
    },
    "815": {
        "name": "AudioIsSeekable",
        "args": "HANDLE ret FLOAT"
    },
    "816": {
        "name": "AudioSetPosition",
        "args": "HANDLE,FLOAT"
    },
    "817": {
        "name": "AudioGetPosition",
        "args": "HANDLE ret FLOAT"
    },
    "818": {
        "name": "AudioGetLength",
        "args": "HANDLE ret FLOAT"
    },
    "831": {
        "name": "GetWordInfo",
        "args": "STRING ret STRING"
    },
    "832": {
        "name": "GetAnswer",
        "args": "STRING,STRING ret STRING"
    },
    "833": {
        "name": "GetSentanceTree",
        "args": "STRING ret STRING"
    },
    "834": {
        "name": "GetWordProperty",
        "args": "STRING,STRING,STRING ret STRING"
    },
    "835": {
        "name": "GetWordPropertyInSent",
        "args": "STRING,STRING,FLOAT,STRING ret STRING"
    },
    "836": {
        "name": "GetWordInSentByRole",
        "args": "STRING,STRING ret STRING"
    },
    "837": {
        "name": "GetWordFormCount",
        "args": "STRING ret FLOAT"
    },
    "838": {
        "name": "GetWordForm",
        "args": "STRING,FLOAT,STRING ret STRING"
    },
    "839": {
        "name": "SearchWords",
        "args": "STRING ret HANDLE"
    },
    "840": {
        "name": "GetWordInfo",
        "args": "STRING, HANDLE"
    },
    "841": {
        "name": "SendSMS",
        "args": "STRING,STRING"
    },
    "842": {
        "name": "ScreenShot",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "843": {
        "name": "SendMail",
        "args": "STRING"
    },
    "844": {
        "name": "ScreenShot",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret HANDLE"
    },
    "845": {
        "name": "ScreenShot",
        "args": "HANDLE ret HANDLE"
    },
    "846": {
        "name": "GetFontName2d",
        "args": "HANDLE,HANDLE ret STRING"
    },
    "847": {
        "name": "GetFontSize2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "848": {
        "name": "GetTextCount2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "849": {
        "name": "GetFontStyle2d",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "850": {
        "name": "SetFontSize2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "851": {
        "name": "SetFontStyle2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "852": {
        "name": "SetFontName2d",
        "args": "HANDLE,HANDLE,STRING ret FLOAT"
    },
    "853": {
        "name": "GetTextString2d",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    "854": {
        "name": "GetTextFont2d",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    "855": {
        "name": "GetTextFgColor2d",
        "args": "HANDLE,HANDLE,FLOAT ret COLORREF"
    },
    "856": {
        "name": "GetTextBkColor2d",
        "args": "HANDLE,HANDLE,FLOAT ret COLORREF"
    },
    "857": {
        "name": "SetTextString2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    "858": {
        "name": "SetTextFont2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE ret FLOAT"
    },
    "859": {
        "name": "SetTextFgColor2d",
        "args": "HANDLE,HANDLE,FLOAT,COLORREF ret FLOAT"
    },
    "860": {
        "name": "SetTextBkColor2d",
        "args": "HANDLE,HANDLE,FLOAT,COLORREF ret FLOAT"
    },
    "861": {
        "name": "SetText2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    "862": {
        "name": "CreateFont2dpt",
        "args": "HANDLE,STRING,FLOAT,FLOAT ret HANDLE"
    },
    "863": {
        "name": "SetStandartCursor",
        "args": "HANDLE,FLOAT"
    },
    "864": {
        "name": "SetStandartCursor",
        "args": "STRING,FLOAT"
    },
    "865": {
        "name": "LoadCursor",
        "args": "HANDLE,STRING"
    },
    "866": {
        "name": "LoadCursor",
        "args": "STRING,STRING"
    },
    "867": {
        "name": "inc",
        "args": "&FLOAT"
    },
    "868": {
        "name": "inc",
        "args": "&FLOAT,FLOAT"
    },
    "869": {
        "name": "dec",
        "args": "&FLOAT"
    },
    "870": {
        "name": "dec",
        "args": "&FLOAT,FLOAT"
    },
    "871": {
        "name": "limit",
        "args": "FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "872": {
        "name": "GetFontList",
        "args": ""
    },
    "873": {
        "name": "vSort",
        "args": "HANDLE,FLOAT,[STRING] ret FLOAT"
    },
    "874": {
        "name": "vSort",
        "args": "HANDLE,[STRING] ret FLOAT"
    },
    "875": {
        "name": "vSort",
        "args": "HANDLE,[STRING,FLOAT]  ret FLOAT"
    },
    "876": {
        "name": "GetUserKeyValue",
        "args": "STRING ret STRING"
    },
    "877": {
        "name": "GetUserKeyFullValue",
        "args": "STRING ret STRING"
    },
    "878": {
        "name": "GetTempDirectory",
        "args": ""
    },
    "879": {
        "name": "SendUserResult",
        "args": "HANDLE ret FLOAT"
    },
    "880": {
        "name": "CopyUserResult",
        "args": ""
    },
    "881": {
        "name": "GetROMDriveNames",
        "args": ""
    },
    "882": {
        "name": "ShellWait",
        "args": "STRING,STRING,STRING,FLOAT  ret FLOAT"
    },
    "883": {
        "name": "ReadUserKey",
        "args": "STRING ret HANDLE"
    },
    "884": {
        "name": "GetUserKeyValue",
        "args": "HANDLE,STRING ret STRING"
    },
    "885": {
        "name": "GetUserKeyFullValue",
        "args": "HANDLE,STRING ret STRING"
    },
    "886": {
        "name": "SendUserResult",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "887": {
        "name": "CopyUserResult",
        "args": "HANDLE ret FLOAT"
    },
    "888": {
        "name": "ReadProjectKey",
        "args": "HANDLE,STRING ret FLOAT"
    },
    "889": {
        "name": "UserKeyIsAutorized",
        "args": ""
    },
    "890": {
        "name": "UserKeyIsAutorized",
        "args": "HANDLE ret FLOAT"
    },
    "891": {
        "name": "SearchWords",
        "args": "STRING,FLOAT ret HANDLE"
    },
    "892": {
        "name": "SearchWords",
        "args": "STRING,FLOAT,FLOAT ret HANDLE"
    },
    "893": {
        "name": "FindNextWord",
        "args": "STRING ret STRING"
    },
    "894": {
        "name": "FindPrevWord",
        "args": "STRING ret STRING"
    },
    "895": {
        "name": "AnalyseWord",
        "args": "STRING ret STRING"
    },
    "896": {
        "name": "InitAnalyzer",
        "args": "STRING,STRING,STRING ret FLOAT"
    },
    "897": {
        "name": "MorphDivide",
        "args": "STRING ret STRING"
    },
    "898": {
        "name": "SetMorphDivide",
        "args": "STRING,STRING ret FLOAT"
    },
    "899": {
        "name": "WordDivide",
        "args": "STRING,STRING ret STRING"
    },
    "900": {
        "name": "AnimationState_GetTimePosition",
        "args": "HANDLE ret FLOAT"
    },
    "901": {
        "name": "AnimationState_SetTimePosition",
        "args": "HANDLE, FLOAT"
    },
    "902": {
        "name": "AnimationState_GetLength",
        "args": "HANDLE ret FLOAT"
    },
    "903": {
        "name": "AnimationState_SetLength",
        "args": "HANDLE, FLOAT"
    },
    "904": {
        "name": "AnimationState_GetWeight",
        "args": "HANDLE ret FLOAT"
    },
    "905": {
        "name": "AnimationState_SetWeight",
        "args": "HANDLE, FLOAT"
    },
    "906": {
        "name": "AnimationState_AddTime",
        "args": "HANDLE, FLOAT"
    },
    "907": {
        "name": "AnimationState_GetEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "908": {
        "name": "AnimationState_SetEnabled",
        "args": "HANDLE, FLOAT"
    },
    "909": {
        "name": "AnimationState_SetLoop",
        "args": "HANDLE, FLOAT"
    },
    "910": {
        "name": "AnimationState_GetLoop",
        "args": "HANDLE ret FLOAT"
    },
    "911": {
        "name": "Bone_SetManuallyControlled",
        "args": "HANDLE, FLOAT"
    },
    "912": {
        "name": "Bone_GetManuallyControlled",
        "args": "HANDLE ret FLOAT"
    },
    "913": {
        "name": "Bone_Reset",
        "args": "HANDLE"
    },
    "914": {
        "name": "Camera_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "915": {
        "name": "Camera_Destroy",
        "args": "HANDLE"
    },
    "916": {
        "name": "Camera_SetFOV",
        "args": "HANDLE, FLOAT"
    },
    "917": {
        "name": "Camera_GetFOV",
        "args": "HANDLE ret FLOAT"
    },
    "918": {
        "name": "Camera_SetAspectRatio",
        "args": "HANDLE, FLOAT"
    },
    "919": {
        "name": "Camera_GetAspectRatio",
        "args": "HANDLE ret FLOAT"
    },
    "920": {
        "name": "Camera_SetNearClipDistance",
        "args": "HANDLE, FLOAT"
    },
    "921": {
        "name": "Camera_GetNearClipDistance",
        "args": "HANDLE ret FLOAT"
    },
    "922": {
        "name": "Camera_SetFarClipDistance",
        "args": "HANDLE, FLOAT"
    },
    "923": {
        "name": "Camera_GetFarClipDistance",
        "args": "HANDLE ret FLOAT"
    },
    "924": {
        "name": "Camera_SetProjectionType",
        "args": "HANDLE, FLOAT"
    },
    "925": {
        "name": "Camera_GetProjectionType",
        "args": "HANDLE ret FLOAT"
    },
    "926": {
        "name": "Camera_SetPolygonMode",
        "args": "HANDLE, FLOAT"
    },
    "927": {
        "name": "Camera_GetPolygonMode",
        "args": "HANDLE ret FLOAT"
    },
    "928": {
        "name": "Camera_SetFrustumOffset",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "929": {
        "name": "Camera_SetFocalLength",
        "args": "HANDLE, FLOAT"
    },
    "930": {
        "name": "Collision_RayCast",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "931": {
        "name": "Collision_Sort",
        "args": ""
    },
    "932": {
        "name": "Collision_GetResultCount",
        "args": ""
    },
    "933": {
        "name": "Collision_GetDistance",
        "args": "FLOAT ret FLOAT"
    },
    "934": {
        "name": "Collision_GetObject",
        "args": "FLOAT ret HANDLE"
    },
    "935": {
        "name": "Entity_Create",
        "args": "HANDLE, STRING, STRING ret HANDLE"
    },
    "936": {
        "name": "Entity_Destroy",
        "args": "HANDLE"
    },
    "937": {
        "name": "Entity_SetMaterial",
        "args": "HANDLE, FLOAT, STRING"
    },
    "938": {
        "name": "Entity_GetAnimationState",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "939": {
        "name": "Entity_GetBone",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "940": {
        "name": "Light_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "941": {
        "name": "Light_Destroy",
        "args": "HANDLE"
    },
    "942": {
        "name": "Light_SetAttenuation",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "943": {
        "name": "Light_SetSpotlightRange",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "944": {
        "name": "Light_SetDiffuseColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "945": {
        "name": "Light_SetSpecularColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "946": {
        "name": "Light_SetType",
        "args": "HANDLE, FLOAT"
    },
    "947": {
        "name": "Light_SetPowerScale",
        "args": "HANDLE, FLOAT"
    },
    "948": {
        "name": "Light_GetPowerScale",
        "args": "HANDLE ret FLOAT"
    },
    "949": {
        "name": "ManualObject_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "950": {
        "name": "ManualObject_Destroy",
        "args": "HANDLE"
    },
    "951": {
        "name": "ManualObject_Clear",
        "args": "HANDLE"
    },
    "952": {
        "name": "ManualObject_EstimateVertexCount",
        "args": "HANDLE, FLOAT"
    },
    "953": {
        "name": "ManualObject_EstimateIndexCount",
        "args": "HANDLE, FLOAT"
    },
    "954": {
        "name": "ManualObject_SetDynamic",
        "args": "HANDLE, FLOAT"
    },
    "955": {
        "name": "ManualObject_GetDynamic",
        "args": "HANDLE ret FLOAT"
    },
    "956": {
        "name": "ManualObject_Begin",
        "args": "HANDLE, STRING, FLOAT"
    },
    "957": {
        "name": "ManualObject_End",
        "args": "HANDLE"
    },
    "958": {
        "name": "ManualObject_Position",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "959": {
        "name": "ManualObject_Normal",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "960": {
        "name": "ManualObject_Colour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "961": {
        "name": "ManualObject_TextureCoord",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "962": {
        "name": "ManualObject_Index",
        "args": "HANDLE, FLOAT"
    },
    "963": {
        "name": "ManualObject_ConvertToMesh",
        "args": "HANDLE, STRING"
    },
    "964": {
        "name": "Material_Create",
        "args": "STRING ret HANDLE"
    },
    "965": {
        "name": "Material_Get",
        "args": "STRING ret HANDLE"
    },
    "966": {
        "name": "Material_GetBestTechnique",
        "args": "HANDLE ret HANDLE"
    },
    "967": {
        "name": "Material_GetTechniqueByName",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "968": {
        "name": "Material_GetTechniqueByIndex",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "969": {
        "name": "Movable_SetParent",
        "args": "HANDLE, HANDLE"
    },
    "970": {
        "name": "Movable_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    "971": {
        "name": "Movable_SetCastShadows",
        "args": "HANDLE, FLOAT"
    },
    "972": {
        "name": "Movable_GetCastShadows",
        "args": "HANDLE ret FLOAT"
    },
    "973": {
        "name": "Movable_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    "974": {
        "name": "Movable_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    "975": {
        "name": "Node_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "976": {
        "name": "Node_SetRotationEulerXYZ",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "977": {
        "name": "Node_SetRotationEulerXZY",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "978": {
        "name": "Node_SetRotationEulerYXZ",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "979": {
        "name": "Node_SetRotationEulerYZX",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "980": {
        "name": "Node_SetRotationEulerZXY",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "981": {
        "name": "Node_SetRotationEulerZYX",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "982": {
        "name": "Node_SetRotationAxis",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "983": {
        "name": "Node_SetRotationQuaternion",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "984": {
        "name": "Node_SetScale",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "985": {
        "name": "Node_SetParent",
        "args": "HANDLE, HANDLE"
    },
    "986": {
        "name": "Node_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    "987": {
        "name": "Node_AddChild",
        "args": "HANDLE, HANDLE"
    },
    "988": {
        "name": "Node_RemoveChild",
        "args": "HANDLE, HANDLE"
    },
    "989": {
        "name": "Overlay_Get",
        "args": "STRING ret HANDLE"
    },
    "990": {
        "name": "Overlay_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    "991": {
        "name": "Overlay_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    "992": {
        "name": "OverlayElement_Get",
        "args": "STRING ret HANDLE"
    },
    "993": {
        "name": "OverlayElement_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    "994": {
        "name": "OverlayElement_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    "995": {
        "name": "OverlayElement_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "996": {
        "name": "OverlayElement_SetSize",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "997": {
        "name": "OverlayElement_SetColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "998": {
        "name": "OverlayElement_SetCaption",
        "args": "HANDLE, STRING"
    },
    "999": {
        "name": "OverlayElement_SetMaterialName",
        "args": "HANDLE, STRING"
    },
    "1000": {
        "name": "ParticleSystem_Create",
        "args": "HANDLE, STRING, STRING ret HANDLE"
    },
    "1001": {
        "name": "ParticleSystem_Destroy",
        "args": "HANDLE"
    },
    "1002": {
        "name": "Pass_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1003": {
        "name": "Pass_SetAmbient",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1004": {
        "name": "Pass_SetDiffuse",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1005": {
        "name": "Pass_SetSpecular",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1006": {
        "name": "Pass_SetShininess",
        "args": "HANDLE, FLOAT"
    },
    "1007": {
        "name": "Pass_SetSelfIllumination",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1008": {
        "name": "Pass_SetSceneBlending",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1009": {
        "name": "Pass_SetDepthCheckEnabled",
        "args": "HANDLE, FLOAT"
    },
    "1010": {
        "name": "Pass_SetDepthWriteEnabled",
        "args": "HANDLE, FLOAT"
    },
    "1011": {
        "name": "Pass_SetDepthFunction",
        "args": "HANDLE, FLOAT"
    },
    "1012": {
        "name": "Pass_SetColourWriteEnabled",
        "args": "HANDLE, FLOAT"
    },
    "1013": {
        "name": "Pass_SetCullingMode",
        "args": "HANDLE, FLOAT"
    },
    "1014": {
        "name": "Pass_SetLightingEnabled",
        "args": "HANDLE, FLOAT"
    },
    "1015": {
        "name": "Pass_SetShadingMode",
        "args": "HANDLE, FLOAT"
    },
    "1016": {
        "name": "Pass_SetPolygonMode",
        "args": "HANDLE, FLOAT"
    },
    "1017": {
        "name": "Pass_SetAlphaRejectSettings",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1018": {
        "name": "Pass_GetTextureUnitStateByName",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1019": {
        "name": "Pass_GetTextureUnitStateByIndex",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1020": {
        "name": "RenderTexture_Create",
        "args": "STRING, FLOAT, FLOAT ret HANDLE"
    },
    "1021": {
        "name": "RenderTexture_Destroy",
        "args": "HANDLE"
    },
    "1022": {
        "name": "RenderWindow_Create",
        "args": "HANDLE, FLOAT, FLOAT ret HANDLE"
    },
    "1023": {
        "name": "RenderWindow_GetPrimary",
        "args": ""
    },
    "1024": {
        "name": "RenderWindow_Destroy",
        "args": "HANDLE"
    },
    "1025": {
        "name": "RenderWindow_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1026": {
        "name": "RenderWindow_SetSize",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1027": {
        "name": "Root_Create",
        "args": "STRING, STRING, STRING"
    },
    "1028": {
        "name": "Root_Destroy",
        "args": ""
    },
    "1029": {
        "name": "Root_Initialise",
        "args": ""
    },
    "1030": {
        "name": "Root_IsInitialised",
        "args": ""
    },
    "1031": {
        "name": "Root_RestoreConfig",
        "args": ""
    },
    "1032": {
        "name": "Root_SaveConfig",
        "args": ""
    },
    "1033": {
        "name": "Root_ShowConfigDialog",
        "args": ""
    },
    "1034": {
        "name": "Root_RenderOneFrame",
        "args": ""
    },
    "1035": {
        "name": "Root_AddResourceLocationFromConfigFile",
        "args": "STRING"
    },
    "1036": {
        "name": "Root_AddResourceLocation",
        "args": "STRING, STRING, STRING, FLOAT"
    },
    "1037": {
        "name": "Root_InitialiseAllResourceGroups",
        "args": ""
    },
    "1038": {
        "name": "Root_GetTime",
        "args": ""
    },
    "1039": {
        "name": "Scene_Create",
        "args": "STRING ret HANDLE"
    },
    "1040": {
        "name": "Scene_Destroy",
        "args": "HANDLE"
    },
    "1041": {
        "name": "Scene_SetWorldGeometry",
        "args": "HANDLE, STRING"
    },
    "1042": {
        "name": "Scene_GetRootSceneNode",
        "args": "HANDLE ret HANDLE"
    },
    "1043": {
        "name": "Scene_SetShadowTechnique",
        "args": "HANDLE, FLOAT"
    },
    "1044": {
        "name": "Scene_GetShadowTechnique",
        "args": "HANDLE ret FLOAT"
    },
    "1045": {
        "name": "Scene_SetFog",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1046": {
        "name": "Scene_SetAmbientLight",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1047": {
        "name": "Scene_SetSkyBox",
        "args": "HANDLE, FLOAT, STRING, FLOAT"
    },
    "1048": {
        "name": "Scene_GetCamera",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1049": {
        "name": "Scene_GetEntity",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1050": {
        "name": "Scene_GetLight",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1051": {
        "name": "Scene_GetParticleSystem",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1052": {
        "name": "Scene_GetSceneNode",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1053": {
        "name": "Scene_Clear",
        "args": "HANDLE"
    },
    "1054": {
        "name": "Scene_Load",
        "args": "HANDLE, STRING"
    },
    "1055": {
        "name": "SceneNode_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1056": {
        "name": "SceneNode_Destroy",
        "args": "HANDLE"
    },
    "1057": {
        "name": "SceneNode_SetAutoTracking",
        "args": "HANDLE, HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1058": {
        "name": "SceneNode_AttachObject",
        "args": "HANDLE, HANDLE"
    },
    "1059": {
        "name": "SceneNode_DetachObject",
        "args": "HANDLE, HANDLE"
    },
    "1060": {
        "name": "Technique_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1061": {
        "name": "Technique_GetPassByName",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1062": {
        "name": "Technique_GetPassByIndex",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1063": {
        "name": "TextureUnitState_Create",
        "args": "HANDLE, STRING ret HANDLE"
    },
    "1064": {
        "name": "TextureUnitState_SetTexture",
        "args": "HANDLE, STRING, FLOAT"
    },
    "1065": {
        "name": "TextureUnitState_GetTexture",
        "args": "HANDLE, STRING, HANDLE"
    },
    "1066": {
        "name": "Viewport_Create",
        "args": "HANDLE, HANDLE, FLOAT ret HANDLE"
    },
    "1067": {
        "name": "Viewport_Destroy",
        "args": "HANDLE"
    },
    "1068": {
        "name": "Viewport_SetCamera",
        "args": "HANDLE, HANDLE"
    },
    "1069": {
        "name": "Viewport_GetCamera",
        "args": "HANDLE ret HANDLE"
    },
    "1070": {
        "name": "Viewport_SetBackgroundColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1071": {
        "name": "Viewport_SetDimensions",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1072": {
        "name": "Viewport_SetOverlaysEnabled",
        "args": "HANDLE, FLOAT"
    },
    "1073": {
        "name": "Viewport_GetOverlaysEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "1074": {
        "name": "Viewport_GetRay",
        "args": "HANDLE, FLOAT, FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1075": {
        "name": "RenderWindow_CreateEx",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT ret HANDLE"
    },
    "1076": {
        "name": "RenderWindow_ToggleFullscreen",
        "args": "HANDLE ret FLOAT"
    },
    "1077": {
        "name": "BillboardSet_Create",
        "args": "HANDLE, STRING, FLOAT ret HANDLE"
    },
    "1078": {
        "name": "BillboardSet_Destroy",
        "args": "HANDLE"
    },
    "1079": {
        "name": "BillboardSet_CreateBillboard",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT ret HANDLE"
    },
    "1080": {
        "name": "BillboardSet_GetNumBillboards",
        "args": "HANDLE ret FLOAT"
    },
    "1081": {
        "name": "BillboardSet_GetBillboard",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1082": {
        "name": "BillboardSet_RemoveBillboard",
        "args": "HANDLE, HANDLE"
    },
    "1083": {
        "name": "BillboardSet_SetBillboardType",
        "args": "HANDLE, FLOAT"
    },
    "1084": {
        "name": "BillboardSet_GetBillboardType",
        "args": "HANDLE ret FLOAT"
    },
    "1085": {
        "name": "BillboardSet_SetCommonDirection",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1086": {
        "name": "BillboardSet_GetCommonDirection",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1087": {
        "name": "BillboardSet_SetCommonUpVector",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1088": {
        "name": "BillboardSet_GetCommonUpVector",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1089": {
        "name": "BillboardSet_SetDefaultDimensions",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1090": {
        "name": "BillboardSet_GetDefaultDimensions",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1091": {
        "name": "BillboardSet_SetMaterialName",
        "args": "HANDLE, STRING"
    },
    "1092": {
        "name": "BillboardSet_GetMaterialName",
        "args": "HANDLE, &STRING"
    },
    "1093": {
        "name": "Billboard_SetRotation",
        "args": "HANDLE, FLOAT"
    },
    "1094": {
        "name": "Billboard_GetRotation",
        "args": "HANDLE ret FLOAT"
    },
    "1095": {
        "name": "Billboard_SetPosition",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1096": {
        "name": "Billboard_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1097": {
        "name": "Billboard_SetColour",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1098": {
        "name": "Billboard_GetColour",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1101": {
        "name": "SetControlFont2d",
        "args": "HANDLE,HANDLE,HANDLE  ret FLOAT   "
    },
    "1102": {
        "name": "SetControlTextColor2d",
        "args": "HANDLE,HANDLE,COLORREF  ret FLOAT   "
    },
    "1103": {
        "name": "GetControlTextLength2d",
        "args": "HANDLE,HANDLE ret FLOAT "
    },
    "1104": {
        "name": "GetControlText2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT ret STRING "
    },
    "1105": {
        "name": "AddControlText2d",
        "args": "HANDLE,HANDLE,STRING  ret FLOAT   "
    },
    "1106": {
        "name": "AddControlText2d",
        "args": "HANDLE,HANDLE,STRING,FLOAT  ret FLOAT   "
    },
    "1107": {
        "name": "SetWindowOwner",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "1108": {
        "name": "SetWindowParent",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "1109": {
        "name": "GetProjectClasses",
        "args": "FLOAT ret HANDLE"
    },
    "1110": {
        "name": "GetClassFile",
        "args": "STRING ret STRING"
    },
    "1111": {
        "name": "AddText2d",
        "args": "HANDLE,HANDLE,FLOAT,HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    "1112": {
        "name": "RemoveText2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "1113": {
        "name": "AddText2d",
        "args": "HANDLE,HANDLE, HANDLE,HANDLE,COLORREF,COLORREF ret FLOAT"
    },
    "1114": {
        "name": "LBGetSelIndexs",
        "args": "HANDLE,HANDLE ret HANDLE"
    },
    "1115": {
        "name": "SetStringBufferMode",
        "args": "FLOAT"
    },
    "1116": {
        "name": "SetModelText",
        "args": "STRING,HANDLE,FLOAT ret FLOAT"
    },
    "1117": {
        "name": "SendSMS",
        "args": "STRING,STRING,FLOAT  ret FLOAT"
    },
    "1118": {
        "name": "SendMail",
        "args": "STRING ,FLOAT  ret FLOAT"
    },
    "1119": {
        "name": "SetControlFocus2d",
        "args": "HANDLE,HANDLE"
    },
    "1120": {
        "name": "DbSQL",
        "args": "HANDLE,HANDLE,FLOAT ret HANDLE"
    },
    "1121": {
        "name": "SetObjectAlpha2d",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    },
    "1122": {
        "name": "GetObjectAlpha2d",
        "args": "HANDLE,HANDLE  ret FLOAT"
    },
    "1123": {
        "name": "SetBrushPoints2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "1124": {
        "name": "SetBrushColors2d",
        "args": "HANDLE,HANDLE,HANDLE ret FLOAT"
    },
    "1125": {
        "name": "SetDibPixel2d",
        "args": "HANDLE,HANDLE,FLOAT,FLOAT,COLORREF ret FLOAT"
    },
    "1126": {
        "name": "EncryptStream",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "1127": {
        "name": "SendData",
        "args": "STRING ,FLOAT  ret FLOAT"
    },
    "1128": {
        "name": "DecryptStream",
        "args": "HANDLE,HANDLE ret FLOAT"
    },
    "1129": {
        "name": "roundt",
        "args": "FLOAT,FLOAT ret FLOAT"
    },
    "1130": {
        "name": "SetSpaceRenderEngine2d",
        "args": "HANDLE,FLOAT ret FLOAT"
    },
    "1200": {
        "name": "Viewport_AddCompositor",
        "args": "HANDLE, STRING, FLOAT ret HANDLE"
    },
    "1201": {
        "name": "Viewport_RemoveCompositor",
        "args": "HANDLE, HANDLE"
    },
    "1202": {
        "name": "Viewport_GetNumCompositors",
        "args": "HANDLE ret FLOAT"
    },
    "1203": {
        "name": "Viewport_GetCompositor",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1204": {
        "name": "Compositor_SetEnabled",
        "args": "HANDLE, FLOAT"
    },
    "1205": {
        "name": "Compositor_GetEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "1206": {
        "name": "Node_GetName",
        "args": "HANDLE, &STRING"
    },
    "1207": {
        "name": "Node_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1208": {
        "name": "Node_GetScale",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1209": {
        "name": "Node_GetRotationQuaternion",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1210": {
        "name": "Node_GetNumChildren",
        "args": "HANDLE ret FLOAT"
    },
    "1211": {
        "name": "Node_GetChild",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1212": {
        "name": "Movable_GetName",
        "args": "HANDLE, &STRING"
    },
    "1213": {
        "name": "Movable_GetBoundingBox",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1214": {
        "name": "SceneNode_GetNumObjects",
        "args": "HANDLE ret FLOAT"
    },
    "1215": {
        "name": "SceneNode_GetObject",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1216": {
        "name": "SceneNode_SetVisible",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1217": {
        "name": "SceneNode_GetScene",
        "args": "HANDLE ret HANDLE"
    },
    "1218": {
        "name": "ParticleSystem_CreateEx",
        "args": "HANDLE, STRING, STRING ret HANDLE"
    },
    "1219": {
        "name": "Material_GetName",
        "args": "HANDLE, &STRING"
    },
    "1220": {
        "name": "MovableText_Create",
        "args": "STRING, STRING, STRING ret HANDLE"
    },
    "1221": {
        "name": "MovableText_Destroy",
        "args": "HANDLE"
    },
    "1222": {
        "name": "MovableText_SetFontName",
        "args": "HANDLE, STRING"
    },
    "1223": {
        "name": "MovableText_GetFontName",
        "args": "HANDLE, &STRING"
    },
    "1224": {
        "name": "MovableText_SetCaption",
        "args": "HANDLE, STRING"
    },
    "1225": {
        "name": "MovableText_GetCaption",
        "args": "HANDLE, &STRING"
    },
    "1226": {
        "name": "MovableText_SetColor",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT, FLOAT"
    },
    "1227": {
        "name": "MovableText_GetColor",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1228": {
        "name": "MovableText_SetCharacterHeight",
        "args": "HANDLE, FLOAT"
    },
    "1229": {
        "name": "MovableText_GetCharacterHeight",
        "args": "HANDLE ret FLOAT"
    },
    "1230": {
        "name": "MovableText_SetSpaceWidth",
        "args": "HANDLE, FLOAT"
    },
    "1231": {
        "name": "MovableText_GetSpaceWidth",
        "args": "HANDLE ret FLOAT"
    },
    "1232": {
        "name": "MovableText_SetTextAlignment",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1233": {
        "name": "MovableText_GetTextAlignment",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1234": {
        "name": "MovableText_SetGlobalTranslation",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1235": {
        "name": "MovableText_GetGlobalTranslation",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1236": {
        "name": "MovableText_SetLocalTranslation",
        "args": "HANDLE, FLOAT, FLOAT, FLOAT"
    },
    "1237": {
        "name": "MovableText_GetLocalTranslation",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1238": {
        "name": "Overlay_Create",
        "args": "STRING ret HANDLE"
    },
    "1239": {
        "name": "Overlay_GetName",
        "args": "HANDLE, &STRING"
    },
    "1240": {
        "name": "Overlay_FindElementAt",
        "args": "HANDLE, FLOAT, FLOAT ret HANDLE"
    },
    "1241": {
        "name": "Overlay_SetZOrder",
        "args": "HANDLE, FLOAT"
    },
    "1242": {
        "name": "Overlay_GetZOrder",
        "args": "HANDLE ret FLOAT"
    },
    "1243": {
        "name": "Overlay_SetScale",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1244": {
        "name": "Overlay_GetScale",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1245": {
        "name": "Overlay_SetScroll",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1246": {
        "name": "Overlay_GetScroll",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1247": {
        "name": "Overlay_SetRotate",
        "args": "HANDLE, FLOAT"
    },
    "1248": {
        "name": "Overlay_GetRotate",
        "args": "HANDLE ret FLOAT"
    },
    "1249": {
        "name": "Overlay_AddChild",
        "args": "HANDLE, HANDLE"
    },
    "1250": {
        "name": "Overlay_RemoveChild",
        "args": "HANDLE, HANDLE"
    },
    "1251": {
        "name": "OverlayContainer_AddChild",
        "args": "HANDLE, HANDLE"
    },
    "1252": {
        "name": "OverlayContainer_RemoveChild",
        "args": "HANDLE, HANDLE"
    },
    "1253": {
        "name": "OverlayContainer_GetChild",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1254": {
        "name": "OverlayContainer_GetChildCount",
        "args": "HANDLE ret FLOAT"
    },
    "1255": {
        "name": "OverlayElement_Create",
        "args": "STRING, STRING ret HANDLE"
    },
    "1256": {
        "name": "OverlayElement_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1257": {
        "name": "OverlayElement_GetSize",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1258": {
        "name": "OverlayElement_GetColour",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1259": {
        "name": "OverlayElement_GetCaption",
        "args": "HANDLE, &STRING"
    },
    "1260": {
        "name": "OverlayElement_GetMaterialName",
        "args": "HANDLE, &STRING"
    },
    "1261": {
        "name": "OverlayElement_SetMetricsMode",
        "args": "HANDLE, FLOAT"
    },
    "1262": {
        "name": "OverlayElement_GetMetricsMode",
        "args": "HANDLE ret FLOAT"
    },
    "1263": {
        "name": "OverlayElement_SetAlignment",
        "args": "HANDLE, FLOAT, FLOAT"
    },
    "1264": {
        "name": "OverlayElement_GetAlignment",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1265": {
        "name": "OverlayElement_IsContainer",
        "args": "HANDLE ret FLOAT"
    },
    "1266": {
        "name": "OverlayElement_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    "1267": {
        "name": "Entity_GetMaterial",
        "args": "HANDLE, FLOAT, &STRING"
    },
    "1268": {
        "name": "Entity_GetSubEntityCount",
        "args": "HANDLE ret FLOAT"
    },
    "1269": {
        "name": "Pass_GetAmbient",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1270": {
        "name": "Pass_GetDiffuse",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1271": {
        "name": "Pass_GetSpecular",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1272": {
        "name": "Pass_GetShininess",
        "args": "HANDLE ret FLOAT"
    },
    "1273": {
        "name": "Pass_GetSelfIllumination",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1274": {
        "name": "Pass_GetSceneBlending",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1275": {
        "name": "Pass_GetDepthCheckEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "1276": {
        "name": "Pass_GetDepthWriteEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "1277": {
        "name": "Pass_GetDepthFunction",
        "args": "HANDLE ret FLOAT"
    },
    "1278": {
        "name": "Pass_GetColourWriteEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "1279": {
        "name": "Pass_GetCullingMode",
        "args": "HANDLE ret FLOAT"
    },
    "1280": {
        "name": "Pass_GetLightingEnabled",
        "args": "HANDLE ret FLOAT"
    },
    "1281": {
        "name": "Pass_GetShadingMode",
        "args": "HANDLE ret FLOAT"
    },
    "1282": {
        "name": "Pass_GetPolygonMode",
        "args": "HANDLE ret FLOAT"
    },
    "1283": {
        "name": "Pass_GetAlphaRejectSettings",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1284": {
        "name": "Node_GetDerivedPosition",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1285": {
        "name": "Node_GetDerivedScale",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1286": {
        "name": "Node_GetDerivedRotationQuaternion",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1287": {
        "name": "StringInterface_SetParameter",
        "args": "HANDLE, STRING, STRING"
    },
    "1288": {
        "name": "StringInterface_GetParameter",
        "args": "HANDLE, STRING, STRING"
    },
    "1289": {
        "name": "StringInterface_GetParameterCount",
        "args": "HANDLE ret FLOAT"
    },
    "1290": {
        "name": "StringInterface_GetParameterType",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "1291": {
        "name": "StringInterface_GetParameterName",
        "args": "HANDLE, FLOAT, STRING"
    },
    "1292": {
        "name": "StringInterface_GetParameterDescription",
        "args": "HANDLE, FLOAT, STRING"
    },
    "1293": {
        "name": "Entity_GetVertexCount",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "1294": {
        "name": "Entity_GetIndexCount",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "1295": {
        "name": "RenderWindow_GetCursorPosition",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1296": {
        "name": "RenderWindow_GetCursorHovered",
        "args": "HANDLE ret FLOAT"
    },
    "1297": {
        "name": "RenderWindow_GetMouseButtonPressed",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "1298": {
        "name": "RenderWindow_GetKeyboardButtonPressed",
        "args": "HANDLE, FLOAT ret FLOAT"
    },
    "1299": {
        "name": "RenderWindow_GetViewportCount",
        "args": "HANDLE ret FLOAT"
    },
    "1300": {
        "name": "RenderWindow_GetViewport",
        "args": "HANDLE, FLOAT ret HANDLE"
    },
    "1301": {
        "name": "RenderWindow_GetCount",
        "args": ""
    },
    "1302": {
        "name": "RenderWindow_Get",
        "args": "FLOAT ret HANDLE"
    },
    "1303": {
        "name": "RenderWindow_GetWheelPosition",
        "args": "HANDLE ret FLOAT"
    },
    "1304": {
        "name": "RenderWindow_Create2",
        "args": "HANDLE, STRING, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT, FLOAT ret HANDLE"
    },
    "1305": {
        "name": "ParticleSystem_SetVisible",
        "args": "HANDLE, FLOAT"
    },
    "1306": {
        "name": "ParticleSystem_GetVisible",
        "args": "HANDLE ret FLOAT"
    },
    "1307": {
        "name": "ParticleSystem_SetParent",
        "args": "HANDLE, HANDLE"
    },
    "1308": {
        "name": "ParticleSystem_GetParent",
        "args": "HANDLE ret HANDLE"
    },
    "1309": {
        "name": "ParticleSystem_GetName",
        "args": "HANDLE, STRING"
    },
    "1310": {
        "name": "Viewport_GetBackgroundColour",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT"
    },
    "1311": {
        "name": "Viewport_GetDimensions",
        "args": "HANDLE, &FLOAT, &FLOAT, &FLOAT, &FLOAT"
    },
    "1312": {
        "name": "RenderWindow_GetPosition",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1313": {
        "name": "RenderWindow_GetSize",
        "args": "HANDLE, &FLOAT, &FLOAT"
    },
    "1501": {
        "name": "NUI_Init",
        "args": ""
    },
    "1502": {
        "name": "NUI_GetDeviceCount",
        "args": ""
    },
    "1503": {
        "name": "NUI_CreateInstance",
        "args": "FLOAT ret HANDLE"
    },
    "1504": {
        "name": "NUI_DestroyInstance",
        "args": "HANDLE"
    },
    "1505": {
        "name": "NUI_GetDeviceName",
        "args": "HANDLE ret STRING"
    },
    "1506": {
        "name": "NUI_InitInstance",
        "args": "HANDLE,FLOAT,FLOAT,FLOAT ret FLOAT"
    },
    "1507": {
        "name": "NUI_GetSkeletonPositions",
        "args": "HANDLE,HANDLE,FLOAT ret FLOAT"
    }
}