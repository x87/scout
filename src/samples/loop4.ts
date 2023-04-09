`
{$CLEO .cs}
0000:

repeat


    wait 0
    
    if 
        0@ < 0
    then
        wait 444
//        break
        jump @www
    end
    
    
    if 
        0@ < 0
    then
        wait 555
        continue
    end
    
    
    :www
    wait 1

until 0@ > 1

0A93: terminate_this_custom_script
`


const content = `
00 00 01 00 04 00 
D6 00 04 00 29 80 03 00 00 04 00 
4D 00 01 DC FF FF FF 01 00 05 BC 01 02 00 01 BE FF FF FF 
D6 00 04 00 29 80 03 00 00 04 00 
4D 00 01 BE FF FF FF 01 00 05 2B 02 02 00 01 BA FF FF FF 01 00 04 01 19 00 03 00 00 04 01 
4D 00 01 FE FF FF FF 93 0A
`;
export default content.replace(/\s/g, '');
