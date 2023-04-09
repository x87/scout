`
{$CLEO}

// this demonstrates a problem from CAT1 script

0000:

jump @middle


while 0@ > 1

    wait 1
    
    :middle
    wait 2


end

end_thread
`

const content = `
00 00 
02 00 01 E5 FF FF FF 19 00 03 00 00 04 01 
4D 00 01 DA FF FF FF 01 00 04 01 01 00 04 02 
02 00 01 F7 FF FF FF 4E 00
`;

export default content.replace(/\s/g, '');