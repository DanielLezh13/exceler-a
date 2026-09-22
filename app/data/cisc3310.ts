import type { MathCourse } from "../math/types.ts";
import { asm, baseOps, branchOps, callOps, grid, hardwareUnit, num, parts, samples, seq } from "./hardwareAuthoring.ts";
import { foundationTests, hardwareFoundations } from "./hardwareFoundations.ts";
import { arrayChapter, branchChapter, executionChapter } from "./hardwarePrograms.ts";
import { cacheChapter, ioChapter, performanceChapter } from "./hardwareSystems.ts";
const p="cisc3310",foundation=hardwareFoundations(p),tests=foundationTests();
const chapters=[...foundation,executionChapter(p),branchChapter(p),arrayChapter(p),performanceChapter(p),cacheChapter(p),ioChapter(p)];
tests.push([
 asm("R0 is an item count0 through 12. Each costs 7, plus a single fee2. Output the bill.","MUL R1,R0,7\nADD R1,R1,2\nOUT R1\nHALT",samples([0,1,5,8,12],n=>[7*n+2]),baseOps,"Separate fixed and variable charges.","7×count+2."),
 asm("R0,R1 are integers−5 through 5. Output the smaller value exactly once.","BLT R0,R1,left\nOUT R1\nHALT\nleft:\nOUT R0\nHALT",grid([-5,-1,0,1,5],(a,b)=>[Math.min(a,b)]),branchOps,"Make equality land on one path.","Either input may be used when they tie."),
 asm("R0=n from 0 through 9. Output n copies of the number3, and nothing when n=0.","MOV R1,0\ncheck:\nBLT R1,R0,body\nHALT\nbody:\nOUT 3\nADD R1,R1,1\nJMP check",samples([0,1,3,9],n=>Array.from({length:n},()=>3)),branchOps,"Count outputs independently from the constant emitted.","The loop runs exactly n times."),
 seq("R0=2,memory[2]=9. Execute LOAD R1,R0; ADD R0,R0,1; OUT R0; OUT R1. Give outputs.",[3,9],"Changing the address register does not change the loaded copy.","R0 becomes 3; R1 keeps 9."),
 asm("R0 is an integer−8 through 8. Output 1 exactly when R0 is at most0, otherwise 0.","BLT R0,1,yes\nOUT 0\nHALT\nyes:\nOUT 1\nHALT",samples([-8,-1,0,1,8],n=>[n<=0?1:0]),branchOps,"Include the zero boundary.","For integers, R0<1 is equivalent to R0≤0."),
 num("R0=1,R1=0. Execute ADD R1,R1,R0; ADD R0,R0,1; ADD R1,R1,R0; OUT R1. What is printed?",3,"Instructions update sequentially.","Add 1, then 2, giving3.")
 ],[
 asm("R0 is an array length0 through 4. Signed values−8 through 8 occupy cells starting at 0. Output the number of negative elements.","MOV R1,0\nMOV R2,0\ncheck:\nBLT R1,R0,body\nOUT R2\nHALT\nbody:\nLOAD R3,R1\nBLT R3,0,neg\nJMP next\nneg:\nADD R2,R2,1\nnext:\nADD R1,R1,1\nJMP check",[[],[-8],[0,2],[-1,-3,0,8],[4,3,2,1]].map(a=>({registers:[a.length],memory:a,output:[a.filter(x=>x<0).length]})),branchOps,"Zero is not negative.","Count loaded elements satisfying value<0."),
 asm("R0 is an integer−5 through 5. Output twice the input minus 1, then the unchanged original input.","MUL R1,R0,2\nSUB R1,R1,1\nOUT R1\nOUT R0\nHALT",samples([-5,-1,0,3,5],n=>[2*n-1,n]),callOps,"Preserve the original for the second output.","Use a separate destination or a saved copy."),
 num("Byte records start at 120, each record is16 bytes, field offset4. Find the field address for record index 5.",204,"Base+stride×index+offset.","120+16×5+4=204."),
 num("240 instructions, CPI 1.25, period 2 ns. CPU time in ns?",600,"Include count, CPI and period.","240×1.25×2=600."),
 num("Five-stage pipeline,20 instructions,3 extra stall cycles. Total cycles?",27,"5+20−1+3.","24 ideal plus 3 stalls."),
 num("80% of original execution time improves by factor4. Overall speedup?",2.5,"The serial20% remains.","1/(.2+.8/4)=2.5."),
 seq("Program: CALL f; OUT 9; HALT; f: OUT 4; RET. Give outputs.",[4,9],"RET resumes after CALL.","Subroutine output precedes caller output.")
 ],[
 parts("Direct-mapped cache has 8 lines,4-byte blocks. Byte address 75: find offset,index,tag.",[["Offset",3],["Index",2],["Tag",2]],"Block 18 maps to line 2.","75=18×4+3; floor(18/8)=2."),
 seq("Empty direct-mapped cache has 2 lines of 2 bytes. Byte accesses: 2,3,6,2,0,1. Give hit1/miss0.",[0,1,0,0,0,1],"Addresses 2 and 6 conflict.","Only 3 and final1 hit a resident block."),
 num("Hit time 2 ns, miss rate20%, additional penalty15 ns. AMAT in ns?",5,"2+.2×15.","5 ns."),
 num("Page size 128 bytes; virtual address 269's page maps to frame 6. Physical address?",781,"Offset is13.","6×128+13=781."),
 num("DMA setup 6 μs;480 bytes at 20 bytes/μs. No setup overlap or completion overhead. Total elapsed μs?",30,"Add setup to transfer time.","6+480/20=30."),
 num("A bus moves16 bytes/cycle at 10 million cycles/s. Bandwidth in decimal MB/s?",160,"Multiply width and frequency.","16×10=160 MB/s."),
 num("A handler waits9 μs and runs8 μs. Relative deadline20 μs. Slack in μs?",3,"20−9−8.","Three μs remain.")
 ]);
export const cisc3310:MathCourse={id:p,code:"CISC 3310",title:"Principles of Computer Architecture",description:"Circuits to running programs: representation, a teaching ISA, arrays and calls, processor timing, caches, and I/O. An independent study track aligned to catalog topics, not a professor-specific assembler or exam guide. CISC 3310 and CISC 3305 are alternative architecture routes, not a required two-course sequence.",prerequisites:[],sources:[{title:"Brooklyn College CISC 3310 catalog: topics, prerequisites and exclusions",url:"https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3310&div=U&dsc=CISC."}],units:["Digital logic","State and representation","Arithmetic and encoding","Programming the machine","Data structures and execution cost","Memory and I/O"].map((title,i)=>hardwareUnit(p,i+1,title,chapters.slice(i*2,i*2+2),tests[i]))};
