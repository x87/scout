`
{$CLEO}
0000:
while true
    if 0@ > 0
    then
       break 
    end
    if 0@ > 1
    then
       jump @exit
    end
end

while true
    if 0@ > 0
    then
       break 
    end
    if 0@ > 1
    then
       jump @exit
    end
end

:exit
end_thread   
`;

const content = `
00 00 

D6 00 04 00 
19 00 03 00 00 04 00 
4D 00 01 E5 FF FF FF 

02 00 01 C5 FF FF FF 
D6 00 04 00 
19 00 03 00 00 04 01 
4D 00 01 CC FF FF FF 

02 00 01 8C FF FF FF 

02 00 01 FE FF FF FF 
D6 00 04 00 
19 00 03 00 00 04 00 
4D 00 01 AC FF FF FF 

02 00 01 8C FF FF FF 

D6 00 04 00 
19 00 03 00 00 04 01 
4D 00 01 93 FF FF FF 

02 00 01 8C FF FF FF 

02 00 01 C5 FF FF FF 

4E 00
`;
export default content.replace(/\s/g, '');
