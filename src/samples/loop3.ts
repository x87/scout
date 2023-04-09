`
{$CLEO}
0000:
          
while 0@ > 100
    if 
        0@ > 2
    then
        wait 1
    else
        wait 2
    end
end

repeat

    wait 3
    if 0@ > 0
    then
      wait 1
    end
until 0@ > 1 // repeat            

while true

    if 0@ > 1
    then
        wait 5
    else
        break          
    end

//    if 
//         0@ > 1
//    jf @end
//        wait 'then'
//        jump @if_end
//        wait 'else'
//    :if_end         
        
//        break
//    end

end // while
                  
:end
end_thread   
`

const content = `

00 00 19 00 03 00 00 04 64 
4D 00 01 C8 FF FF FF 
D6 00 04 00 19 00 03 00 00 04 02 
4D 00 01 D3 FF FF FF 01 00 04 01 
02 00 01 CF FF FF FF 01 00 04 02 
02 00 01 FE FF FF FF 01 00 04 03 
D6 00 04 00 19 00 03 00 00 04 00 
4D 00 01 AE FF FF FF 01 00 04 01 19 00 03 00 00 04 01 
4D 00 01 C8 FF FF FF 
D6 00 04 00 19 00 03 00 00 04 01 
4D 00 01 83 FF FF FF 01 00 04 05 
02 00 01 7C FF FF FF 
02 00 01 75 FF FF FF 
02 00 01 A0 FF FF FF 4E 00`;
export default content.replace(/\s/g, '');