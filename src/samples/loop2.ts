`
{$CLEO}
0000:

while true    
:start
    WAIT 1
    
    IF 0@ > 1
    then
    	WHILE 0@ > 1
    		IF 0@ > 1
    		then
    			jump @start
    		end
    	end
    	WAIT 2
    ELSE
    	IF 0@ > 1
    	then
    		WHILE 0@ > 1
    			IF 0@ > 1
    		    then 
    				continue
    			end
    		end
    	end
    end
end
`


const content = `
00 00 01 00 04 01 
D6 00 04 00 19 00 03 00 00 04 01 
4D 00 01 AF FF FF FF 19 00 03 00 00 04 01 
4D 00 01 BA FF FF FF 
D6 00 04 00 19 00 03 00 00 04 01 
4D 00 01 C1 FF FF FF 
02 00 01 FE FF FF FF 

02 00 01 E8 FF FF FF 01 00 04 02 

02 00 01 6F FF FF FF 

D6 00 04 00 19 00 03 00 00 04 01 
4D 00 01 6F FF FF FF 19 00 03 00 00 04 01 
4D 00 01 6F FF FF FF 
D6 00 04 00 19 00 03 00 00 04 01 
4D 00 01 76 FF FF FF 
02 00 01 76 FF FF FF 

02 00 01 9D FF FF FF 

02 00 01 FE FF FF FF

`;
export default content.replace(/\s/g, '');
