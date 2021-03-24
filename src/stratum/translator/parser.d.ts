export type VarType = "HANDLE" | "STRING" | "FLOAT" | "COLORREF" | "INTEGER";
export type VarModifier = "LOCAL" | "NOSAVE" | "PARAMETER";

// ----------Описание структуры выражений----------
export interface ConstOperand {
    type: "const";
    value: string;
}
export interface VarOperand {
    type: "var";
    name: string;
}
export interface CallOperand {
    type: "call";
    name: string;
    args: Expression[];
    isNew: undefined; //hack
}
export type UnaryOperator = "-" | "!";
export interface UnaryOperand {
    type: UnaryOperator;
    expr: Expression;
}
export interface SubExpressionOperand {
    type: "subexpr";
    expr: Expression;
}
//isNew должна быть только у VarOP - здесь обход бага.
export type Operand = (UnaryOperand | ConstOperand | CallOperand | VarOperand | SubExpressionOperand) & {
    isNew: boolean | undefined; //hack
};
export type BinaryOperator = "**" | "*" | "/" | "%" | "+" | "-" | ">=" | ">" | "<=" | "<" | "==" | "!=" | "&&" | "&" | "||" | "|";
export interface Expression {
    first: Operand;
    rest: {
        action: BinaryOperator;
        operand: Operand;
    }[];
}

// ----------Блок объявления переменных----------
export interface VarsDecl {
    type: "varsDec";
    datatype: VarType;
    modifiers: VarModifier[];
    names: string[];
}

// ----------Присваивание(a := (2 + 5))----------
export interface AssigmentDecl {
    type: ":=" | "::=";
    to: string;
    expr: Expression;
}

// ----------Уравнение(c + 5 = d + 4)----------
export interface EqualityDecl {
    type: "=";
    first: Expression;
    second: Expression;
}

// ----------Вызов функции(test(),best(2, 3))----------
export interface CallChainDecl {
    type: "callChain";
    functions: CallOperand[];
}

// ----------Условные операторы, циклы и свитч----------
export interface IfDecl {
    type: "if";
    expr: Expression;
}
export interface WhileDecl {
    type: "while";
    expr: Expression;
}
export interface UntilDecl {
    type: "until";
    expr: Expression;
}
export interface CaseDecl {
    type: "case";
    expr: Expression;
    then?: CodeLine;
}

export interface ElseDecl {
    type: "else";
    then?: CodeLine;
}
export interface EndifDecl {
    type: "endif";
    then?: CodeLine;
}
export interface BreakDecl {
    type: "break";
}
export interface EndwhileDecl {
    type: "endwhile";
}
export interface DoDecl {
    type: "do";
}
export interface EndSwitchDecl {
    type: "endswitch";
}
export interface SwitchDecl {
    type: "switch";
}
export interface DefaultDecl {
    type: "default";
    then?: CodeLine;
}

export interface FunctionDecl {
    type: "function";
}
export interface ReturnDecl {
    type: "return";
    to: string;
}

export type CodeLine = (
    | VarsDecl
    | AssigmentDecl
    | EqualityDecl
    | IfDecl
    | ElseDecl
    | EndifDecl
    | BreakDecl
    | WhileDecl
    | EndwhileDecl
    | DoDecl
    | UntilDecl
    | EndSwitchDecl
    | SwitchDecl
    | CaseDecl
    | DefaultDecl
    | CallChainDecl
    | FunctionDecl
    | ReturnDecl
) & { then?: CodeLine };

export function parse(code: string): CodeLine[];
