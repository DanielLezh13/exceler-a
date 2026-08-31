import { compactJavaCode, javaValidationCode } from "./practiceValidation.ts";

const identifier = "[A-Za-z_$][\\w$]*";

export const validateLaterMasteryAlternative = (questionId: string, answer: string) => {
  const source = compactJavaCode(answer);
  const equivalentCode = javaValidationCode(answer);

  if (questionId === "unit2-build-admission") {
    const reads = source.match(new RegExp("int(" + identifier + ")=input\\.nextInt\\(\\);boolean(" + identifier + ")=input\\.nextBoolean\\(\\);"));
    if (!reads) return false;
    const age = reads[1];
    const ticket = reads[2];
    const conditions = [...source.matchAll(/if\(([^)]*)\)/g)].map((match) => match[1]);
    const combinesRequirements = conditions.some((condition) => condition.includes(ticket)
      && new RegExp("(?:" + age + ">=18|18<=" + age + ")").test(condition));
    return combinesRequirements
      && /System\.out\.println\("Enter"\)/.test(source)
      && /System\.out\.println\("Denied"\)/.test(source);
  }

  if (questionId === "unit2-build-shipping") {
    return /total<0/.test(source)
      && /total<40/.test(source)
      && /total<75/.test(source)
      && ["Invalid", "Standard", "Reduced", "Free"].every((label) => source.includes('System.out.println("' + label + '")'));
  }

  if (questionId === "unit2-build-menu") {
    const sum = source.match(new RegExp("double(" + identifier + ")=first\\+second;"));
    const difference = source.match(new RegExp("double(" + identifier + ")=first-second;"));
    return /choice==1/.test(source)
      && /choice==2/.test(source)
      && Boolean(sum && new RegExp("System\\.out\\.println\\(" + sum[1] + "\\)").test(source))
      && Boolean(difference && new RegExp("System\\.out\\.println\\(" + difference[1] + "\\)").test(source))
      && /System\.out\.println\("Invalid"\)/.test(source);
  }

  if (questionId === "unit2-build-grade") {
    const hasThreshold = (value: number) => new RegExp("(?:score>=" + value + "|" + value + "<=score)").test(source);
    return source.includes("importjava.util.Scanner;")
      && /publicclass\w+\{publicstaticvoidmain\(String\[\]args\)\{/.test(source)
      && /Scanner\w+=newScanner\(System\.in\);intscore=\w+\.nextInt\(\);/.test(source)
      && /score<0/.test(source)
      && /score>100/.test(source)
      && [90, 80, 70].every(hasThreshold)
      && ["Invalid", "A", "B", "C", "Retry"].every((label) => source.includes('System.out.println("' + label + '")'));
  }

  if (questionId === "unit3-build-sentinel") {
    const inputValue = source.match(new RegExp("int(" + identifier + ")=input\\.nextInt\\(\\);"));
    if (!inputValue) return false;
    const value = inputValue[1];
    return new RegExp("while\\(" + value + "!=0\\)").test(source)
      && new RegExp("(?:[A-Za-z_$][\\w$]*\\+=" + value + ";|[A-Za-z_$][\\w$]*=[A-Za-z_$][\\w$]*\\+" + value + ";)").test(source)
      && /(?:\w+\+\+;|\w+\+=1;|\w+=\w+\+1;)/.test(source)
      && new RegExp(value + "=input\\.nextInt\\(\\);").test(source)
      && /if\(\w+==0\)/.test(source)
      && /System\.out\.println\("Novalues"\)/.test(source)
      && /\(double\)\w+\/\w+/.test(source)
      && /System\.out\.println\(/.test(source);
  }

  if (questionId === "unit3-build-range") {
    const counter = source.match(new RegExp("int(" + identifier + ")=30;"));
    if (!counter) return false;
    const value = counter[1];
    return new RegExp("while\\(" + value + ">=5\\)").test(source)
      && new RegExp("System\\.out\\.println\\(" + value + "\\)").test(source)
      && new RegExp("(?:" + value + "-=5;|" + value + "=" + value + "-5;)").test(source)
      && /System\.out\.println\("Done"\)/.test(source);
  }

  if (questionId === "unit3-build-pattern") {
    const row = source.match(new RegExp("int(" + identifier + ")=1;while\\(\\1<=4\\)"));
    if (!row) return false;
    const inner = source.match(new RegExp("int(" + identifier + ")=1;while\\(\\1<=" + row[1] + "\\)"));
    return Boolean(inner)
      && /System\.out\.print\("\*"\)/.test(source)
      && /System\.out\.println\(\)/.test(source)
      && new RegExp(inner![1] + "\\+\\+;").test(source)
      && new RegExp(row[1] + "\\+\\+;").test(source);
  }

  if (questionId === "unit3-build-statistics") {
    const count = source.match(new RegExp("int(" + identifier + ")=[A-Za-z_$][\\w$]*\\.nextInt\\(\\);"));
    const total = source.match(new RegExp("double(" + identifier + ")=0(?:\\.0)?;"));
    if (!count || !total) return false;
    return source.includes("importjava.util.Scanner;")
      && /Scanner\w+=newScanner\(System\.in\);/.test(source)
      && new RegExp("while\\([A-Za-z_$][\\w$]*<" + count[1] + "\\)").test(source)
      && new RegExp("(?:" + total[1] + "\\+=[A-Za-z_$][\\w$]*\\.nextDouble\\(\\);|" + total[1] + "=" + total[1] + "\\+[A-Za-z_$][\\w$]*\\.nextDouble\\(\\);)").test(source)
      && new RegExp('System\\.out\\.println\\("Total:"\\+' + total[1] + "\\)").test(source)
      && new RegExp('System\\.out\\.println\\("Average:"\\+(?:' + total[1] + "\\/" + count[1] + "|[A-Za-z_$][\\w$]*)\\)").test(source);
  }

  if (questionId === "unit4-build-maximum") {
    const signature = source.match(new RegExp("publicstaticintmaximum\\(int(" + identifier + "),int(" + identifier + "),int(" + identifier + ")\\)"));
    if (!signature) return false;
    const [, first, second, third] = signature;
    return new RegExp("if\\(" + first + ">=" + second + "&&" + first + ">=" + third + "\\)return" + first + ";").test(source)
      && new RegExp("if\\(" + second + ">=" + third + "\\)return" + second + ";").test(source)
      && new RegExp("return" + third + ";").test(source)
      && !/Math\./.test(source);
  }

  if (questionId === "unit4-build-receipt") {
    const signature = source.match(new RegExp("publicstaticvoidprintReceipt\\(String(" + identifier + "),int(" + identifier + "),double(" + identifier + ")\\)"));
    if (!signature) return false;
    const [, item, quantity, price] = signature;
    return new RegExp("System\\.out\\.println\\(" + item + "\\+\":\"\\+(?:" + quantity + "\\*" + price + "|" + price + "\\*" + quantity + ")\\)").test(source)
      && /printReceipt\("[^"]+",2,3\.5\);/.test(source);
  }

  if (questionId === "unit4-build-composition") {
    const doubleMethod = source.match(new RegExp("publicstaticintdoubleValue\\(int(" + identifier + ")\\)\\{return\\1\\*2;\\}"));
    const quadrupleMethod = source.match(new RegExp("publicstaticintquadruple\\(int(" + identifier + ")\\)\\{([^}]*)\\}"));
    if (!doubleMethod || !quadrupleMethod) return false;
    const calls = quadrupleMethod[2].match(new RegExp("doubleValue\\(" + quadrupleMethod[1] + "\\)", "g")) ?? [];
    return calls.length >= 2
      && /quadruple\(5\)/.test(source)
      && /System\.out\.println\(/.test(source);
  }

  if (questionId === "unit4-build-complete") {
    const method = source.match(new RegExp("publicstaticbooleanisValidScore\\(int(" + identifier + ")\\)\\{return([^;]+);\\}"));
    if (!method) return false;
    const score = method[1];
    const condition = method[2];
    const range = new RegExp("(?:" + score + ">=0|0<=" + score + ")").test(condition)
      && new RegExp("(?:" + score + "<=100|100>=" + score + ")").test(condition);
    return source.includes("importjava.util.Scanner;")
      && range
      && /publicstaticvoidmain\(String\[\]args\)/.test(source)
      && new RegExp("boolean(" + identifier + ")=isValidScore\\((" + identifier + ")\\);[\\s\\S]*if\\(\\1\\)").test(source)
      && /System\.out\.println\("Valid"\)/.test(source)
      && /System\.out\.println\("Invalid"\)/.test(source);
  }

  if (questionId === "unit5-build-array-summary") {
    return /publicstaticdoubleaveragePositive\(int\[\]\w+\)/.test(source)
      && /for\(int\w+=0;\w+<\w+\.length;\w+\+\+\)/.test(source)
      && /if\(\w+\[\w+\]>0\)/.test(source)
      && /\w+\+=\w+\[\w+\];/.test(equivalentCode)
      && /(?:\w+\+\+;|\w+\+=1;)/.test(source)
      && /\w+==0\?0\.0:\(double\)\w+\/\w+/.test(source);
  }

  if (questionId === "unit5-build-string") {
    return /publicstaticintcountLetterA\(String\w+\)/.test(source)
      && /for\(int\w+=0;\w+<\w+\.length\(\);\w+\+\+\)/.test(source)
      && /charAt\(\w+\)=='a'\|\|\w+\.charAt\(\w+\)=='A'/.test(source)
      && /\w+\+\+;/.test(source)
      && /return\w+;/.test(source);
  }

  if (questionId === "unit5-build-list") {
    const index = source.match(new RegExp("int(" + identifier + ")=0;while\\(\\1<names\\.size\\(\\)\\)"));
    if (!index) return false;
    const name = index[1];
    return new RegExp("if\\(names\\.get\\(" + name + "\\)\\.isEmpty\\(\\)\\)names\\.remove\\(" + name + "\\);else" + name + "\\+\\+;").test(source)
      && /System\.out\.println\(names\)/.test(source);
  }

  if (questionId === "unit5-build-parallel") {
    const bestName = source.match(new RegExp("String(" + identifier + ")=names\\[0\\];"));
    const bestScore = source.match(new RegExp("int(" + identifier + ")=scores\\[0\\];"));
    if (!bestName || !bestScore) return false;
    return /for\(int\w+=1;\w+<scores\.length;\w+\+\+\)/.test(source)
      && new RegExp("if\\(scores\\[([A-Za-z_$][\\w$]*)\\]>" + bestScore[1] + "\\)").test(source)
      && new RegExp(bestScore[1] + "=scores\\[[A-Za-z_$][\\w$]*\\];").test(source)
      && new RegExp(bestName[1] + "=names\\[[A-Za-z_$][\\w$]*\\];").test(source)
      && new RegExp('System\\.out\\.println\\(' + bestName[1] + '\\+":"\\+' + bestScore[1] + "\\)").test(source);
  }

  if (questionId === "unit6-build-last-search") {
    return /publicstaticintfindLast\(int\[\]\w+,int\w+\)/.test(source)
      && /for\(int\w+=\w+\.length-1;\w+>=0;\w+--\)/.test(source)
      && /if\(\w+\[\w+\]==\w+\)return\w+;/.test(source)
      && /return-1;/.test(source);
  }

  if (questionId === "unit6-build-sort") {
    return /publicstaticvoidselectionSort\(int\[\]\w+\)/.test(source)
      && /while\(\w+<\w+\.length-1\)/.test(source)
      && /int\w+=\w+;/.test(source)
      && /while\(\w+<\w+\.length\)/.test(source)
      && /if\(\w+\[\w+\]<\w+\[\w+\]\)/.test(source)
      && /int\w+=\w+\[\w+\];/.test(source)
      && (source.match(/\w+\[\w+\]=\w+\[\w+\];/g)?.length ?? 0) >= 1
      && /\w+\[\w+\]=\w+;/.test(source);
  }

  if (questionId === "unit6-build-binary") {
    return /publicstaticintbinarySearch\(int\[\]\w+,int\w+\)/.test(source)
      && /int\w+=0;/.test(source)
      && /int\w+=\w+\.length-1;/.test(source)
      && /while\(\w+<=\w+\)/.test(source)
      && /int\w+=\w+\+\(\w+-\w+\)\/2;/.test(source)
      && /if\(\w+\[\w+\]==\w+\)return\w+;/.test(source)
      && /\w+=\w+\+1;/.test(source)
      && /\w+=\w+-1;/.test(source)
      && /return-1;/.test(source);
  }

  if (questionId === "unit6-build-ranked-report") {
    return (source.match(/for\(int\w+=0;[^)]*\)/g)?.length ?? 0) >= 3
      && /if\(scores\[\w+\]<scores\[\w+\+1\]\)/.test(source)
      && /int\w+=scores\[\w+\];/.test(source)
      && /String\w+=names\[\w+\];/.test(source)
      && (source.match(/scores\[[^\]]+\]=scores\[[^\]]+\];/g)?.length ?? 0) >= 1
      && (source.match(/names\[[^\]]+\]=names\[[^\]]+\];/g)?.length ?? 0) >= 1
      && /System\.out\.println\(names\[\w+\]\+":"\+scores\[\w+\]\)/.test(source);
  }

  if (questionId === "unit7-build-stream") {
    const value = source.match(new RegExp("int(" + identifier + ")=input\\.nextInt\\(\\);"));
    return Boolean(value)
      && (source.match(/int\w+=0;/g)?.length ?? 0) >= 2
      && /while\(input\.hasNextInt\(\)\)/.test(source)
      && new RegExp("\\w+\\+=" + value?.[1] + ";").test(source)
      && /\w+\+\+;/.test(source)
      && /System\.out\.println\("Count:"\+\w+\)/.test(source)
      && /System\.out\.println\("Sum:"\+\w+\)/.test(source);
  }

  if (questionId === "unit7-build-formatted") {
    const item = source.match(new RegExp("String(" + identifier + ")=input\\.next\\(\\);"));
    const quantity = source.match(new RegExp("int(" + identifier + ")=input\\.nextInt\\(\\);"));
    const price = source.match(new RegExp("double(" + identifier + ")=input\\.nextDouble\\(\\);"));
    if (!item || !quantity || !price) return false;
    const format = /System\.out\.printf\("%sx%d=\$%\.2f(?:%n|\\n)",/.test(source);
    const product = new RegExp("(?:" + quantity[1] + "\\*" + price[1] + "|" + price[1] + "\\*" + quantity[1] + ")");
    return format && product.test(source);
  }

  if (questionId === "unit7-build-repair") {
    return /publicstaticdoubleaverage\(int\[\]\w+\)/.test(source)
      && /if\(\w+\.length==0\)return0\.0;/.test(source)
      && /for\(int\w+=0;\w+<\w+\.length;\w+\+\+\)/.test(source)
      && /\w+\+=\w+\[\w+\];/.test(equivalentCode)
      && /return\(double\)\w+\/\w+\.length;/.test(source);
  }

  if (questionId === "unit7-build-tests") {
    return [69, 70, 71].every((value) => source.includes("isPassing(" + value + ")"))
      && (source.match(/System\.out\.printf\(/g)?.length ?? 0) >= 3;
  }

  if (questionId === "unit8-build-maximum") {
    return /publicstaticintmaximum\(int\[\]\w+\)/.test(source)
      && /int\w+=\w+\[0\];/.test(source)
      && /for\(int\w+:\w+\)/.test(source)
      && /if\(\w+>\w+\)/.test(source)
      && /\w+=\w+;/.test(source)
      && /return\w+;/.test(source);
  }

  if (questionId === "unit8-build-representation") {
    return /int\w+=0;/.test(source)
      && /for\(int\w+=0;\w+<bits\.length;\w+\+\+\)/.test(source)
      && /if\(bits\[\w+\]==1\)/.test(source)
      && /\w+\+\+;/.test(source)
      && /System\.out\.println\(\w+\)/.test(source);
  }

  if (questionId === "unit8-build-transparent-rule") {
    return /int\w+=0;int\w+=0;while\(\w+<scores\.length\)/.test(source)
      && /if\(scores\[\w+\]>=80\)/.test(source)
      && /System\.out\.println\(names\[\w+\]\)/.test(source)
      && (source.match(/\w+\+\+;/g)?.length ?? 0) >= 2
      && /System\.out\.println\("Selected:"\+\w+\)/.test(source);
  }

  if (questionId === "unit8-build-application") {
    const scanner = source.match(new RegExp("Scanner(" + identifier + ")=newScanner\\(System\\.in\\);"));
    if (!scanner) return false;
    return source.includes("importjava.util.Scanner;")
      && /publicclass\w+\{publicstaticvoidmain\(String\[\]args\)\{/.test(source)
      && /int\w+=0;/.test(source)
      && new RegExp("while\\(" + scanner[1] + "\\.hasNextInt\\(\\)\\)").test(source)
      && new RegExp("if\\(" + scanner[1] + "\\.nextInt\\(\\)<32\\)").test(source)
      && /\w+\+\+;/.test(source)
      && /System\.out\.println\("Frozenreadings:"\+\w+\)/.test(source);
  }

  return false;
};
