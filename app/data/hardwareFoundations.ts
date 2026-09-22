import { bits, lessonChapter, logic, num, parts, seq } from "./hardwareAuthoring.ts";

export const binary=(n:number,width:number)=>((n+2**width)%2**width).toString(2).padStart(width,"0");
export function hardwareFoundations(prefix:string) {
 const gates=lessonChapter(prefix,"logic","Signals into Boolean decisions","Build a condition, then test the cases that could break it.",[],["hw-logic"],[
  "A digital signal is modeled as 0 or 1. NOT reverses a signal; AND is 1 only when both inputs are 1; OR is 1 when either or both inputs are 1. XOR is different: exactly one input must be 1. These are rules for every possible input, not descriptions of what happened in one example. A truth table lists the possibilities so a circuit can be checked before it is built.",
  "Translate requirements in pieces. If p means power and e means error, permission requires p AND NOT e. Parentheses make the grouping explicit. To disprove a proposed design, find just one input where it disagrees with the requirement; to establish equivalence here, check every input combination. De Morgan's laws say NOT(a AND b) = NOT a OR NOT b, and NOT(a OR b) = NOT a AND NOT b. You may enter equivalent expressions using single-letter variables and not, and, or, xor."
 ],["0 means false; 1 means true. Truth-table order for a,b is 00, 01, 10, 11.","Construct the required output, not a list of inputs you happened to test."],[
 {problem:"Enable when power p is on and either key k or override o is on.",steps:["The two ways to authorize are k or o.","Power is required in both cases: p and (k or o).","p=0,k=1,o=1 must still produce 0."]},
 {problem:"Does a or b implement exactly one input?",steps:["Both give 1 for 01 and 10.","At 11, OR gives 1 but exactly-one requires 0.","Use a xor b, or (a and not b) or (not a and b)."]}
 ],"OR includes the both-true case; everyday 'either' sometimes does not.",[
 seq("List the outputs of a and not b for inputs 00, 01, 10, 11.",[0,0,1,0],"Negate b before AND.","Only a=1,b=0 enables it."),
 logic("Construct an alarm: output 1 when door d is open AND guard g is absent (g=0).","d and not g","Which signal must be inverted?","The open door alone is not enough: d and not g."),
 logic("Construct permission: power p is required, and either key k or override o is sufficient.","p and (k or o)","Group the alternatives.","Both authorization paths depend on p."),
 logic("Output 1 when a and b differ. Build the expression.","a xor b","Check 00 and 11 as well.","Exactly one high input is XOR."),
 logic("Output 1 when a and b match, including when both are zero.","not (a xor b)","Invert the disagreement signal.","The required rows are 00 and 11."),
 bits("A requirement says p and (k or o). A proposed circuit is (p and k) or o. Give the three bits pko of its only failing input.","001","Try a powerless override.","At 001 the proposed circuit outputs 1 without power."),
 logic("Construct 'neither a nor b is on'. Equivalent Boolean expressions are accepted.","not (a or b)","Negate the whole OR.","not a and not b is equivalent."),
 logic("A two-sensor shutdown is 1 unless BOTH sensors a and b report safe (1). Construct it.","not (a and b)","Negate the all-safe case.","not a or not b also expresses this condition.")
 ],[
 logic("Power p must be on and fault f off. Construct the enable expression.","p and not f","Both conditions are mandatory.","p and not f."),
 seq("List outputs of not (a or b) for 00, 01, 10, 11.",[1,0,0,0],"Only one row has no active input.","Only 00 gives 1."),
 logic("An indicator is on when exactly one of x and y is on, unless lock l is on. Construct it.","(x xor y) and not l","Combine a disagreement with a veto.","The lock disables both otherwise valid cases."),
 bits("Requirement: not (a and b). Incorrect circuit: not a and not b. Give the failing ab input where a=0.","01","Compare each circuit with b=1.","NAND gives 1 at 01; the incorrect circuit gives 0.")
 ]);
 const circuits=lessonChapter(prefix,"circuits","Select, decode, and add","Build useful components from the signal rules.",["hw-logic"],["hw-circuits"],[
  "A combinational circuit's output depends on its current inputs, with no stored history. A 2-to-1 multiplexer selects input a when select s=0 and input b when s=1: (not s and a) or (s and b). A decoder does the reverse kind of job: an n-bit input selects exactly one of 2^n output lines. A two-bit decoder's line 2 is high for input 10, so its expression is a and not b when a is the high bit.",
  "A half adder takes two one-bit numbers: the sum bit is XOR and the carry is AND. A full adder includes carry-in c. Its sum is a xor b xor c; carry-out is (a and b) or (a and c) or (b and c). Multi-bit addition connects the carry of each low-order stage to the next stage. Delays accumulate along the longest dependent path, not across unrelated gates operating in parallel."
 ],["A mux with 2^n data inputs needs n select bits.","A full-adder numeric total equals 2×carry-out + sum.","For this lesson's ripple-delay model, every carry stage contributes its stated delay."],[
 {problem:"Build a selector that outputs a at s=0 and b at s=1.",steps:["Gate a with not s, gate b with s.","OR the two gated signals.","When s=1, the a branch is forced off."]},
 {problem:"Full adder: a=1,b=0,c=1.",steps:["The integer total is 2.","Binary 2 is 10: carry-out 1, sum 0."]}
 ],"A carry wire is not an extra bit added to every stage independently; it comes from the previous stage.",[
 logic("Build a mux: output x when s=0 and y when s=1.","(not s and x) or (s and y)","Gate each input with its selection case.","Only the selected branch can contribute."),
 logic("A two-bit decoder input is ab, a high-order. Construct output line 3 (high only for binary 11).","a and b","Which input row selects 3?","Both input bits must be 1."),
 logic("Same two-bit decoder: construct output line 1, selected by ab=01.","not a and b","The high bit must be zero.","not a and b matches exactly 01."),
 num("How many select bits does an 8-input mux need?",3,"Count how many choices n bits represent.","2^3=8."),
 parts("Full adder inputs a=1,b=1,c=1. Find both outputs.",[["Sum bit",1],["Carry-out",1]],"Convert total 3 to binary.","3=2×1+1."),
 parts("Full adder inputs a=0,b=1,c=0. Find both outputs.",[["Sum bit",1],["Carry-out",0]],"There is just one unit to add.","1=2×0+1."),
 bits("Add binary 0111 + 0001. Return the four sum bits (ignore carry beyond four bits).","1000","Propagate the low-bit carry.","The carry travels through three consecutive ones."),
 num("A ripple model has six consecutive carry stages, each 2 ns. What is total carry-path delay in ns?",12,"These stages depend on one another.","6×2=12 ns."),
 logic("Construct the carry output of a half adder with inputs x,y.","x and y","A carry requires a total of at least 2.","Only 1+1 produces a carry.")
 ],[
 num("A decoder has five input bits. How many output lines?",32,"One line per input pattern.","2^5=32."),
 logic("A mux selects p at s=0 and q at s=1. Construct the output.","(not s and p) or (s and q)","Use complementary select gates.","The two branches are mutually exclusive."),
 bits("Compute 0101 + 0011 as four bits.","1000","Carry between positions.","5+3=8."),
 parts("Full adder inputs are 1,0,0. Give sum and carry.",[["Sum",1],["Carry",0]],"Add the three single-bit values.","Total 1 has sum 1 and carry 0.")
 ]);
 const state=lessonChapter(prefix,"state","Clock edges and stored state","Trace simultaneous updates without reading the new value too early.",["hw-circuits"],["hw-state"],[
  "Combinational logic alone cannot remember the previous input. A register stores bits and, in our edge-triggered model, changes only at a rising clock edge. Each next-state expression is evaluated from the old register values just before that edge. All enabled registers then latch their new values together. If A←B and B←A are enabled at one edge, the values swap; B does not receive the just-updated A.",
  "An enable determines whether a register loads its input or holds its old value. A synchronous reset is also sampled at the edge; our examples give reset priority over enable. A finite-state machine is a register storing a state plus logic that computes the next state. Write a row for each edge, track the current state first, and apply the stated transition rule once. Between edges, changes at the input may change proposed next values without changing stored state."
 ],["All right-hand sides use pre-edge values.","With reset r and enable e: if r=1 load 0; else if e=1 load D; else hold Q.","An n-bit unsigned counter wraps from 2^n−1 to 0."],[
 {problem:"A=2,B=5; at each edge A←B and B←A+B. Trace two edges.",steps:["First edge uses 2,5: A=5,B=7.","Second edge uses 5,7: A=7,B=12."]},
 {problem:"Q=7, D=9, enable=1, synchronous reset=1.",steps:["Reset is sampled on the rising edge.","Reset has priority, so Q becomes 0, not 9."]}
 ],"A register-transfer arrow describes hardware updates at an edge; do not execute simultaneous transfers like sequential software statements.",[
 parts("A=3,B=8. At one edge A←B and B←A. Give the post-edge values.",[["A",8],["B",3]],"Read both old values first.","The values swap."),
 seq("A=1,B=2. Every edge: A←B, B←A+B simultaneously. Give B after edges 1,2,3.",[3,5,8],"Track pairs: (1,2), then ...","Pairs become (2,3),(3,5),(5,8)."),
 num("Q=6,D=4. At the edge reset=0,enable=0. What is Q after the edge?",6,"Neither clearing nor loading is requested.","The register holds 6."),
 num("Q=6,D=4. At the edge reset=1,enable=1; reset has priority. What is Q?",0,"The higher-priority action wins.","Reset clears Q."),
 seq("A 3-bit unsigned counter starts at 6 and increments at each edge. Give the next four stored decimal values.",[7,0,1,2],"The largest stored value is 7.","The counter wraps modulo 8."),
 seq("A machine has states 0 and 1, starts at 0, toggles when input x=1 and holds when x=0. Inputs at four edges: 1,0,1,1. Give the post-edge states.",[1,1,0,1],"Apply one transition per input.","Only edges with input 1 toggle."),
 num("Q=2; after the last edge D changes from 5 to 9, with no new clock edge. What is Q now?",2,"The register is edge-triggered.","Changing D alone does not change stored Q."),
 parts("A=4,B=7; one edge performs A←A+B and B←A. Give the new pair.",[["A",11],["B",4]],"B reads the old A.","Both updates use pre-edge state.")
 ],[
 seq("A=2,B=3; at every edge A←B,B←A+B. Give A after three successive edges.",[3,5,8],"Keep a row per edge.","Pairs are (3,5),(5,8),(8,13)."),
 num("A 4-bit counter starts at 14. What is its value after three increments?",1,"Wrap modulo 16.","15,0,1."),
 num("Q=9,D=1,reset=0,enable=1 at a rising edge. Find Q after the edge.",1,"This edge enables the load.","Q takes D."),
 seq("A two-state toggle machine starts at 1. It toggles for input 1 and holds for 0. Edge inputs: 0,1,1. Give the stored states.",[1,0,1],"The first edge holds.","Then two toggles return to 1.")
 ]);
 const representation=lessonChapter(prefix,"representation","Bit patterns and their meanings","Decode a value only after choosing its representation.",["hw-state"],["hw-representation"],[
  "Binary place values from the right are 1,2,4,8 and so on. An n-bit unsigned pattern represents 0 through 2^n−1. Hexadecimal groups four bits into one digit: 0 through 9 then A=10 through F=15. The bits do not say whether they are signed. For n-bit two's complement, the highest bit has weight −2^(n−1); equivalently, interpret as unsigned and subtract 2^n when that bit is 1. The range is −2^(n−1) through 2^(n−1)−1.",
  "To encode a negative number −k in n-bit two's complement, encode 2^n−k. Sign extension preserves its value at a larger width by repeating its sign bit. Zero extension instead adds zeroes and preserves unsigned values. Other encodings exist: sign-magnitude uses a sign and a positive magnitude; one's complement negates by inverting every bit. Both have two encodings for zero. Byte order is separate: little-endian stores the least significant byte at the lowest byte address; big-endian stores the most significant byte first."
 ],["Always label the width and signedness before decoding.","A byte is 8 bits. Hex digits represent groups of 4 bits.","Endianness orders bytes in memory, not the bits within each byte."],[
 {problem:"Decode 1110 as unsigned and as four-bit two's complement.",steps:["Unsigned: 8+4+2=14.","Two's complement: 14−16=−2."]},
 {problem:"Store hex 1234 as two bytes in little-endian order.",steps:["Low byte is hex 34 (decimal 52); high byte is hex 12 (decimal 18).","At the lower address store 52, then 18."]}
 ],"The leftmost bit is not always a separate minus sign. Two's complement assigns it a negative place value.",[
 ...[13,26,41].map(n=>bits(`Encode unsigned decimal ${n} in exactly six bits.`,binary(n,6),"Use powers of two.",`${n} = binary ${binary(n,6)}.`)),
 num("Decode 110101 as unsigned decimal.",53,"Weights are 32,16,8,4,2,1.","32+16+4+1=53."),
 num("Decode 110101 as six-bit two's complement.",-11,"The unsigned value is 53; subtract 64.","53−64=−11."),
 bits("Encode −9 in six-bit two's complement.","110111","Add −9 to 64.","64−9=55, encoded 110111."),
 bits("Sign-extend four-bit two's complement 1011 to eight bits.","11111011","Repeat the sign bit.","Both patterns represent −5."),
 bits("Zero-extend unsigned 1011 to eight bits.","00001011","Keep the value positive.","Both represent 11."),
 parts("For five-bit two's complement, give the smallest and largest values.",[["Smallest",-16],["Largest",15]],"The positive range has one fewer value.","Range −2^4 to 2^4−1."),
 seq("A two-byte value is hex 02A1. Give its two stored bytes in decimal, lowest address first, for little-endian memory.",[161,2],"Hex A1 is 10×16+1.","Store the low byte 161 before the high byte 2."),
 parts("Decode 1001 in two different four-bit formats.",[["Sign-magnitude",-1],["One's complement",-6]],"For one's complement, invert to find the positive magnitude.","Sign-magnitude: sign 1, magnitude 001. One's complement: invert to 0110=6.")
 ],[
 num("Interpret 111001 as six-bit two's complement.",-7,"Unsigned is 57.","57−64=−7."),
 bits("Encode −4 in eight-bit two's complement.","11111100","256−4=252.","252 has pattern 11111100."),
 seq("Store hex 030B as two bytes in big-endian order. Give decimal bytes from lowest to highest address.",[3,11],"High byte goes first.","Hex 03 is 3; hex 0B is 11."),
 parts("Four bits contain 1111. Give its unsigned and two's-complement meanings.",[["Unsigned",15],["Signed",-1]],"Same bits, different weights.","15 unsigned; 15−16=−1 signed.")
 ]);
 const arithmetic=lessonChapter(prefix,"arithmetic","Finite-width arithmetic and masks","Separate the mathematical answer from the bits that fit.",["hw-representation","hw-logic"],["hw-arithmetic"],[
  "An n-bit adder keeps the low n bits, which is arithmetic modulo 2^n. Unsigned carry-out means the true positive total exceeded the largest unsigned value. Signed overflow means the mathematical signed result falls outside the signed range. These are different questions: four-bit 1111+0001 produces 0000 with carry, but −1+1=0 is perfectly valid signed arithmetic. Adding two positives and obtaining a negative sign, or two negatives and obtaining a positive sign, signals signed overflow.",
  "Bitwise AND, OR and XOR apply a Boolean rule at every position. A mask selects positions: AND with 1 keeps a bit; AND with 0 clears it. OR with 1 forces a bit on; XOR with 1 toggles it. Logical left shift inserts zeroes at the right and discards high bits that no longer fit. Logical right shift inserts zeroes at the left. Arithmetic right shift repeats the sign bit instead; for signed negatives this differs from logical shifting. State the width and shift type before tracing."
 ],["Wrapped result = mathematical result modulo 2^n, expressed in n bits.","Unsigned carry and signed overflow are separate outputs.","Masks are applied position by position, never as Boolean truth of the whole word."],[
 {problem:"Four-bit addition 0111+0001.",steps:["The stored result is 1000.","No unsigned carry: 7+1 fits unsigned four bits.","Signed overflow: +8 is outside −8..7; the stored bits decode as −8."]},
 {problem:"Logical and arithmetic right shift of 1010 by one, width four.",steps:["Logical inserts 0: 0101.","Arithmetic repeats sign 1: 1101."]}
 ],"A wrapped bit pattern can be produced correctly by hardware while representing an overflowed signed calculation.",[
 ...[[7,3],[14,5],[8,8]].map(([a,b])=>bits(`Add unsigned four-bit values ${a} and ${b}. Return only the stored four bits.`,binary(a+b,4),"Keep the low four bits.",`(${a}+${b}) mod 16 = ${(a+b)%16}.`)),
 parts("Four-bit 0110+0011: give unsigned carry-out and signed overflow as 0 or 1.",[["Carry-out",0],["Signed overflow",1]],"Compare 9 against each range.","9 fits unsigned but not signed four bits."),
 parts("Four-bit 1111+0001: give unsigned carry-out and signed overflow as 0 or 1.",[["Carry-out",1],["Signed overflow",0]],"Signed operands are −1 and +1.","Unsigned 16 carries; signed 0 is representable."),
 bits("Apply bitwise AND: 11010110 AND 00001111. Return eight bits.","00000110","The mask keeps only the low four positions.","High bits are cleared; low 0110 remains."),
 bits("Find an eight-bit AND mask that clears the lowest two bits and preserves all others.","11111100","Use zero only where clearing is required.","Six ones preserve the upper six positions."),
 bits("Find an eight-bit XOR mask that toggles only the highest bit.","10000000","XOR zero holds; XOR one flips.","Only position 7 has a 1 in the mask."),
 bits("Shift 10110100 logically right by two, width eight.","00101101","Insert two zeroes at the left.","Discard the two low bits."),
 bits("Shift 10110100 arithmetically right by two, width eight.","11101101","Copy the old sign bit.","Insert two ones at the left."),
 bits("Shift 1101 left by one, keeping four bits.","1010","The old highest bit falls off.","Append zero and retain only four bits.")
 ],[
 bits("Add 1100 + 0111, keeping four bits.","0011","12+7=19.","19 modulo 16 is 3."),
 parts("Four-bit 1000+1111: give stored signed value and signed-overflow flag.",[["Stored signed value",7],["Overflow (0/1)",1]],"−8 plus −1 is below the signed range.","Bits 0111 represent +7; the real result −9 does not fit."),
 bits("Find an eight-bit OR mask to force only the lowest three bits to 1 and leave other positions unchanged.","00000111","OR zero preserves each other bit.","The three low positions use ones."),
 bits("Logical right shift 1110 by one, four-bit width.","0111","Logical shift inserts zero.","The result is unsigned 7.")
 ]);
 const encoding=lessonChapter(prefix,"encoding","Fractions, rounding, and error checks","Use a fully specified small format before generalizing to real hardware.",["hw-arithmetic"],["hw-encoding"],[
  "Binary fractional positions have weights 1/2,1/4,1/8 and so on: 0.101₂ is 5/8. Floating point separates sign, exponent and fraction to represent a wide range at limited precision. Our teaching format has fields s|eee|ff with exponent bias 3. For normal encodings with eee from 001 to 110, value = (−1)^s × (1+f/4) × 2^(E−3), where E and f are the unsigned exponent and fraction fields. We reserve exponent 000 and 111 and do not use them. This is a small teaching format, not the full IEEE 754 standard.",
  "Spacing grows when the exponent grows. At exponent E=3, adjacent positive values differ by 1/4; at E=4, they differ by 1/2. Round to the nearest representable value; in an exact tie, choose the value whose fraction integer f is even. Error checks address corrupted storage or transmission rather than rounding. An even-parity bit makes the total number of 1 bits even. Any odd number of flipped bits is detected, but some even-number flips are invisible. Hamming distance counts differing positions; a code of minimum distance d detects up to d−1 flips and corrects up to floor((d−1)/2)."
 ],["Teaching normal format only: s|eee|ff, bias 3, implicit leading 1, E=1..6.","Parity detects some errors; it does not locate a bad bit.","Minimum-distance guarantees assume a bounded number of bit flips."],[
 {problem:"Decode 0|100|10 in the teaching format.",steps:["E=4, f=2; significand 1+2/4=1.5.","Value is +1.5×2^(4−3)=3."]},
 {problem:"Append an even-parity bit to data 1011.",steps:["The data contains three ones.","Append 1 so the total four is even; the transmitted word is 10111."]}
 ],"A passed parity check does not prove the data is unchanged, and a decimal value is not necessarily exactly representable in binary.",[
 num("Convert binary fraction 0.011 to a decimal value.",0.375,"Use 1/4 and 1/8.","0.25+0.125=0.375."),
 num("Decode teaching normal floating point 0|011|11 (bias 3, fraction divisor 4).",1.75,"E=3,f=3.","(1+3/4)×2^0=1.75."),
 num("Decode teaching normal floating point 1|010|10 (bias 3, fraction divisor 4).",-0.75,"The sign is negative and exponent is −1.","−1.5×2^−1=−0.75."),
 bits("Encode +5 in the normal s|eee|ff format: bias 3, value (−1)^s(1+f/4)2^(E−3). Return six bits without separators.","010101","Write 5 as 1.25×2^2.","s=0,E=5 (101),f=1 (01)."),
 num("In the teaching format, round 1.38 to the nearest representable value. Nearby values are 1.25,1.5,1.75.",1.5,"Compare distances.","Distance to 1.5 is .12, less than .13 to 1.25."),
 num("Round 1.375 in the teaching format, nearest with ties to even fraction integer. Neighbors: 1.25 (f=1),1.5 (f=2).",1.5,"The distances tie.","Choose f=2, which is even."),
 num("What is the spacing between adjacent normal values with stored exponent E=5 in the teaching format?",1,"Fraction increments by 1/4.","(1/4)×2^(5−3)=1."),
 num("What even-parity bit must be appended to data 110010?",1,"Count the ones.","Three ones need a fourth."),
 num("A valid even-parity word suffers exactly two bit flips. Will its parity check fail? Enter 1 for detected, 0 for not detected.",0,"Each flip toggles parity.","Two flips restore even parity."),
 num("Find Hamming distance between 101101 and 100011.",3,"Count differing positions.","Positions 3,4,5 differ counting from the left."),
 parts("A code has minimum distance 5. Give the guaranteed detection and correction limits.",[["Detect up to flips",4],["Correct up to flips",2]],"Use d−1 and floor((d−1)/2).","Detection 4; correction 2.")
 ],[
 num("Decode normal teaching float 1|100|01 with bias 3 and two fraction bits.",-2.5,"Sign −; significand 1.25; exponent +1.","−1.25×2=−2.5."),
 bits("Encode +0.5 in teaching s|eee|ff, bias 3, implicit leading 1. Return six bits.","001000","0.5=1.00×2^−1.","s=0,E=2 (010),f=00."),
 num("Append an even-parity bit to data 111100. What is the bit?",0,"There are four ones.","The count is already even."),
 parts("Minimum code distance is 3. Give guaranteed detection and correction limits.",[["Detect flips",2],["Correct flips",1]],"Detection and correction differ.","d−1=2 and floor(2/2)=1.")
 ]);
 return [gates,circuits,state,representation,arithmetic,encoding];
}

export function foundationTests() { return [
 [logic("An output is 1 if either sensor a or sensor b is on, but only while enable e is on. Construct it.","(a or b) and e","Enable applies to the whole alternative.","Group OR before AND."),logic("Construct decoder line 0 for two-bit input ab.","not a and not b","Only 00 activates it.","Both inputs must be zero."),num("A 16-input mux needs how many select bits?",4,"Find n such that 2^n=16.","Four bits select 16 cases."),parts("A full adder receives 0,1,1. Give sum and carry.",[["Sum",0],["Carry",1]],"Total 2 is binary 10.","Sum 0, carry 1."),bits("Add 1001 + 0010 as four bits.","1011","9+2=11.","Binary 1011."),logic("Construct a circuit that is on unless BOTH a and b are on.","not (a and b)","There is only one off row.","NAND rejects 11.")],
 [parts("A=5,B=9. One clock edge performs A←A+B,B←A. Give new A,B.",[["A",14],["B",5]],"Both expressions use old state.","The new A does not feed B at this edge."),seq("A 3-bit counter starts at 5. Give values after four increments.",[6,7,0,1],"Wrap at eight.","6,7,0,1."),num("Decode 10110 as five-bit two's complement.",-10,"22−32.","The sign bit has weight −16."),bits("Encode unsigned 37 in six bits.","100101","32+4+1.","Use six positions."),bits("Sign extend 1100 from four to eight bits.","11111100","Repeat the sign bit.","Value −4 is preserved."),seq("Store hex 0712 in little-endian order. Give the two bytes in decimal, lowest address first.",[18,7],"Low byte first.","Hex 12 is decimal18.")],
 [parts("Four-bit addition 0101+0100: give stored signed value and signed-overflow flag.",[["Signed value",-7],["Overflow",1]],"Bits 1001 have a negative signed weight.","Mathematical 9 is outside −8..7."),bits("Give an eight-bit AND mask preserving only the highest four bits.","11110000","Clear the low nibble.","AND uses zeroes to clear."),bits("Logical right shift 10010000 by three, width eight.","00010010","Insert three zeroes.","The retained high five bits move right."),num("Decode teaching float 0|101|10; bias3 and two fraction bits.",6,"1.5×2^(5−3).","Value is 6."),num("Even-parity data is 10011011. Which parity bit must be appended?",1,"Five data bits are 1.","Append 1 for an even count."),parts("A code has minimum distance 4. Give guaranteed detection and correction limits.",[["Detect",3],["Correct",1]],"Use distance bounds.","Detect 3; correct floor(3/2)=1.")]
 ]; }
