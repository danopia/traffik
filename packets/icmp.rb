class ICMP
  def initialize packet
    @type, @code, @sum = packet.unpack('CCn')
    
    # packet[8..-1]
  end
end

