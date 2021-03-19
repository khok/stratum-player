type CodeLine = (
    | VarsDecl
    | AssigmentOperator
    | EqualityOpereator
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
    | CallOperatorChain
    | FunctionDecl
    | ReturnDecl
) & { then?: CodeLine };

type IfDecl = NormalIfDecl | BuggedIfDecl;
interface NormalIfDecl {
    type: "if";
    expr: Expression;
}

interface ElseDecl {
    type: "else";
    then?: CodeLine;
}
interface EndifDecl {
    type: "endif";
    then?: CodeLine;
}
interface BreakDecl {
    type: "break";
}
interface WhileDecl {
    type: "while";
    expr: Expression;
}
interface EndwhileDecl {
    type: "endwhile";
}
interface DoDecl {
    type: "do";
}
interface UntilDecl {
    type: "until";
    expr: Expression;
}

interface EndSwitchDecl {
    type: "endswitch";
}
interface SwitchDecl {
    type: "switch";
}
interface CaseDecl {
    type: "case";
    expr: Expression;
    then?: CodeLine;
}
interface DefaultDecl {
    type: "default";
    then?: CodeLine;
}

interface FunctionDecl {
    type: "function";
}
interface ReturnDecl {
    type: "return";
    to: ValidVarName;
}

interface VarsDecl {
    type: "varsDec";
    datatype: VarType;
    modifiers: VarModifier[];
    names: VarNames;
}

interface AssigmentOperator {
    type: ":=" | "::=";
    to: ValidVarName;
    operand: Operand;
}

interface EqualityOpereator {
    type: "=";
    first: Operand;
    second: Operand;
}

interface CallOperator {
    type: "call";
    name: ValidFunctionName;
    args: CallOperatorArg[];
    isNew: undefined;
}

interface CallOperatorChain {
    type: "callChain";
    functions: CallOperator[];
}

interface UnaryOperator {
    type: UnaryAction;
    operand: Operand;
}

interface Expression {
    type: "expression";
    body: Operand;
}

interface Const {
    type: "const";
    value: string;
}

interface VarValueOperator {
    type: "var";
    name: ValidVarName;
}

type ValidFunctionName = ValidVarName;

type UnaryAction = "-" | "+" | "!";

type BinaryAction = "**" | "*" | "/" | "%" | "+" | "-" | ">>" | ">=" | ">" | "<<" | "<=" | "<" | "==" | "!=" | "&&" | "&" | "||" | "|";

interface Operand {
    first: OP;
    rest: {
        action: BinaryAction;
        op: OP;
    }[];
}
type OP = (UnaryOperator | Const | CallOperator | VarValueOperator | Expression) & {
    isNew?: boolean;
};

//Все что касается блока объявления переменных
type VarType = string; //'HANDLE'i / "STRING"i / "FLOAT"i / "COLORREF"i / "INTEGER"i
type VarModifier = string; //'LOCAL'i / 'NOSAVE'i / 'PARAMETER'i

type VarNames = ValidVarName[];

type CallOperatorArg = Operand;

type ValidVarName = string;

type Space = string;
type NewLine = string;

interface BuggedIfDecl {
    type: "if";
    expr: ExpressionForBuggedIf;
}
interface ExpressionForBuggedIf {
    type: "expression";
    body: Operand;
}

export function parse(code: string): CodeLine[];
