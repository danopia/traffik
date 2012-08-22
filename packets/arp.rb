class ARP
  def initialize packet
    @hwType, @protoType, @hwSize, @protoSize, @opcode = packet.unpack('nnCCn')
    @sender = {:mac => packet[8,  6], :ip => packet[14, 4]}
    @target = {:mac => packet[18, 6], :ip => packet[24, 4]}
    
    p self
  end
end

