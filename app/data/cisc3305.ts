import type { MathCourse } from "../math/types.ts";
import { asm, baseOps, hardwareUnit, logic, num, parts, samples, seq } from "./hardwareAuthoring.ts";
import { foundationTests, hardwareFoundations } from "./hardwareFoundations.ts";
import { executionChapter } from "./hardwarePrograms.ts";
import { concurrencyChapter, controlChapter, ioChapter, reliabilityChapter, storageChapter } from "./hardwareSystems.ts";
const p="cisc3305",tests=foundationTests();
const chapters=[...hardwareFoundations(p),executionChapter(p),controlChapter(p),storageChapter(p),ioChapter(p),reliabilityChapter(p),concurrencyChapter(p)];
tests.push([
 asm("R0 is a count0 through 10. A block needs 4 words per item plus 3 header words. Output total words.","MUL R1,R0,4\nADD R1,R1,3\nOUT R1\nHALT",samples([0,1,2,6,10],n=>[4*n+3]),baseOps,"Account for header once.","4×count+3."),
 seq("R0=6. Execute MOV R1,R0; SUB R0,R0,2; OUT R1; OUT R0. Give outputs.",[6,4],"The copy is independent.","R1 keeps 6; R0 becomes 4."),
 parts("PC=15,memory[15]=38. Fetch cycles: MAR←PC; MDR←memory[MAR],PC←PC+1; IR←MDR. Give final PC and IR.",[["PC",16],["IR",38]],"Each transfer uses previous-cycle state.","Fetch 38 and advance to 16."),
 parts("MDR=12,IR=5,MAR=3,memory[3]=29. One edge performs MDR←memory[MAR],IR←MDR. New MDR,IR?",[["MDR",29],["IR",12]],"IR uses the old MDR.","29 does not reach IR on the same edge."),
 num("A control store has 256 words of 16 bits. How many bytes?",512,"Convert bits to bytes.","256×16/8=512."),
 logic("Drivers a and b share a bus. Build a safe signal that is1 when at most one driver is enabled.","not (a and b)","Negate the conflict condition.","00,01,10 are safe;11 is not."),
 num("Instruction fetch 3 cycles, execution4 cycles, additional waits2 cycles. No overlap. Total?",9,"All stated intervals are serial.","3+4+2=9.")
 ],[
 parts("Build8192×16 from 2048×8 chips. Give number of banks and total chips.",[["Banks",4],["Chips",8]],"Two chips supply width per bank.","4 banks×2 chips=8."),
 num("A byte region starts at 256 and occupies64 bytes. Last inclusive address?",319,"Subtract 1 from start+size.","256+64−1=319."),
 num("A512-word chip ignores a higher region address bit. Region-relative word address 700 aliases which lower address?",188,"Discard the512 place.","700−512=188."),
 num("Exactly180 polls cost 2 μs each. Total CPU μs?",360,"Count×cost.","180×2=360."),
 num("DMA setup 9 μs;840 bytes at 30 bytes/μs. Transfer starts after setup. Total elapsed μs?",37,"9+840/30.","Transfer 28 μs, total 37."),
 num("A bus sends8 bytes/cycle at 40 million cycles/s. Ideal decimal MB/s?",320,"8×40.","320 MB/s."),
 num("DMA work60 μs and CPU work75 μs fully overlap after setup with no contention. Time until both finish in μs?",75,"Use the maximum.","The CPU work finishes last.")
 ],[
 num("MTBF396 hours and MTTR4 hours. Availability as a fraction?",0.99,"396/(396+4).","396/400=.99."),
 num("Last checkpoint completed at 30 s; failure at 38 s; restore takes 2 s. Restore plus repeated-work time?",10,"Eight seconds are lost.","8+2=10 seconds."),
 seq("Majority voter input rows001,011,100,110. Give outputs.",[0,1,0,1],"At least two high inputs are necessary.","Only 011 and 110 pass."),
 num("Base 900,limit 50. Translate logical address 49.",949,"49 is the last valid offset.","900+49=949."),
 num("Shared x=2. A loads2; B loads2; A adds 4 and stores6; B adds 1 to its old copy and stores3. Final x?",3,"Use the exact store order.","B's final3 overwrites A's6."),
 num("Periodic execution/period pairs are(3 ms,10 ms) and(4 ms,20 ms). Total utilization?",0.5,"Sum each task's share.",".3+.2=.5."),
 num("A job released at 4 ms waits5 ms then runs8 ms. Absolute deadline15 ms. How late is completion, in ms?",2,"Completion=4+5+8.","17−15=2 ms late.")
 ]);
export const cisc3305:MathCourse={id:p,code:"CISC 3305",title:"Computer Organization",description:"Design and trace the machine: digital logic, representation, register-transfer control, storage, I/O, reliability, and concurrent systems. Catalog-aligned independent study, with a small teaching-assembly bridge. Official prerequisites include CISC 1341 and CISC 2210; this bridge does not replace that credit. This is an alternative to CISC 3310, not an extra required architecture course.",prerequisites:[],sources:[{title:"Brooklyn College CISC 3305 catalog: topics, prerequisites and exclusions",url:"https://websql.brooklyn.cuny.edu/courses/ShowCourse.do?crs_num=3305&div=U&dsc=CISC."}],units:["Digital building blocks","Stored state and data","Finite arithmetic and protection bits","Instructions and control","Storage and I/O organization","Dependability and concurrent systems"].map((title,i)=>hardwareUnit(p,i+1,title,chapters.slice(i*2,i*2+2),tests[i]))};
