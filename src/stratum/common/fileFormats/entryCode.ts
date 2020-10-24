export enum EntryCode {
    // CLASS records
    CR_MATH = 1,
    //
    CR_MATHDATA = 2,
    //
    // размер переменной
    CR_FLAGS = 4,
    // флаг класса
    CR_VARS = 5,
    // переменные
    CR_CHILDS = 6,
    // чилды
    CR_LINKS = 7,
    // св¤зи
    CR_ICON = 8,
    // иконка (пока ее нет)
    CR_SCHEME = 9,
    // схема класса
    CR_TEXT = 10,
    // исходный текст присваиваний
    CR_VARSIZE = 11,
    // размер переменных (пишетс¤ только встроенными классами)
    CR_IMAGE = 12,
    // двухмерное изображение класса
    CR_CODE = 13,
    // это выполнимый код
    CR_INFO = 14,
    // текст примечаний
    CR_VARS1 = 15,
    CR_CHILDSname = 16,

    CR_CHILDSnameXY = 17, // — координатами и флагами

    CR_DEFICON = 20,
    CR_CLASSTIME = 21,
    CR_ICONFILE = 22, // им¤ иконки

    CR_HELPFILE = 25,

    CR_EQU = 30,
    CR_MOVEINFO = 31,

    RR_VERSION = 40,

    // Project file records (записи файла проекта)
    PR_MAINCLASS = 100,
    PR_PASSWORD = 101,
    PR_VARS = 102,
    PR_WATCH = 103,
    // State file records

    VR_CLASSES = 1000, // копи¤ структуру класса и подклассов
    VR_VARS = 1001, // Ќепосредственно значени¤
    VR_SETVAR = 1002, // ѕредустановленные переменные

    CR_CLASSINFO = 8000,

    // ??????

    //ƒл¤ описани¤ страницы дл¤ печати

    PPR_FIELDS = 2048, // пол¤
    PPR_ADDFIELDS = 2049, // добавочные пол¤
    PPR_SCALEMODE = 2050,
    PPR_SCALECUSTOM = 2051,
    PPR_FIELDSMODE = 2052, // ѕол¤ дл¤ внешних листов
    PPR_USEADDF = 2053, // »спользовать добавочные пол¤
    PPR_SRCRECT = 2054, // исходник
    PPR_USESRC = 2055, // использовать исходник
    PPR_PAGECOUNT = 2056, // число копий

    CLF_LOADED = 1,
    CLF_PROJECT = 2,
    CLF_MODIFY = 4,
    CLF_READONLY = 8,
    CLF_NORECURSE = 16,
    CLF_ADDLIB = 32,
    CLF_CURRENTPROJECT = 64,
    CLF_LIBRARY = 256,
    CLF_PACKFILE = 512, // библиотека является PACK файлом или класс в PACK файле

    /*
 Это были флаги для TClassListInfo
*/

    CF_PROTECTED = 1,
    CF_ONEFASE = 2,
    CF_COMPILED = 4,
    CF_VIRTUAL = 8, // Сгенерированн компилятором
    CF_SCHEME = 16, // Имеет схему
    CF_MODIFY = 32, // класс был изменен
    CF_HAS_DISABLE_VAR = 64, // объект класса может быть запрещен
    CF_BUILDIN = 256,
    CF_ICON = 512,
    CF_PROCEDURE = 1024,
    CF_STRUCTURE = 2048,
    CF_USEDEFICON = 4096,
    CF_SIZEABLE = 8192,
    CF_HAS_ENABLE_VAR = 16384,
    //NO = CF_NOSAVEVAR =  32768ul,
    //NO = CF_AUTOLINK =   0x10000L,
    //NO = CF_AUTORMLINK = 0x20000L,

    TCF_WASSAVE = 1, // Был записан как новый
    TCF_NEWCLASS = 2, // Был создан

    OF_DISABLED = 1,
    OF_ONEFASE = 2,
    OF_ERROR = 4,

    LF_DISABLED = 1,
    //NO = LF_CORRECTPOS = 0x8000ul,
    LF_AUTOLINK = 0x0002, // созданна автоматически

    VF_LOCAL = 2,
    VF_NOREAD = 4,
    VF_NOWRITE = 8,
    VF_STATIC = 16,
    VF_ONSCHEME = 32,
    VF_PARAMETER = 64,
    VF_LEFT = 128,
    VF_EQVAR = 256,
    VF_ARGUMENT = 512,
    VF_RETURN = 1024,
    VF_NOSAVE = 2048,
    VF_GLOBAL = 4096,
    VF_CLASSGLOBAL = 8192,

    //NO = VF_NOTFIXED =   0x10000l,
    //NO = VF_BYCOMPILER = 0x20000l,

    SF_EXTERNAL = 1,
    SF_EDITING = 2,

    STATE_FAST = 0, // Если вызванна из шага то записываются и считываются оба состояния.
    STATE_VARS = 1, // Запись как FAST, но для заданного класса записывается
    // информация о переменных, типах и т. д
    STATE_DEBUG = 2,
    STATE_SET = 3,

    // для TChildInfo.flags
    CHF_NEEDCREATE = 1,
    CHF_NEEDUPDATE = 2,
    CHF_WASSIZED = 4, // был изменен размер
    CHF_PREPROCESS = 8,
    CHF_POSTPROCESS = 16,

    IF_CORRECTED = 1,

    EF_RUNNING = 0x01,
    EF_MUSTSTOP = 0x02, // после шага все чистится ClearAll
    EF_STEPACTIVE = 0x04, // Сейчас идет шаг
    EF_EQUACTIVE = 0x08, // Сейчас идет вычисление уравнений
    EF_MSGACTIVE = 0x10, // Сейчас идет обработка сообщений
    EF_BYTIMER = 0x20, // Вычисления идут по таймеру
    //NO = EF_ONDIALG =    0x40L,  // Сейчас идет обработка диалога
}
