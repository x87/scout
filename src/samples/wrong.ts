`
{$CLEO}

0000:
0002: jump @1
wait 0
              
:1
end_thread   
`


const content = `
00 00 02 00 01 F3 FF FF FF 01 00 04 00 4E 00
`;
export default content.replace(/\s/g, '');
